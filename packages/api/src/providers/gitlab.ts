import { z } from 'zod/v4';

export type DateLike = string | Date;
export type DateRange = { from: DateLike; to: DateLike };

export type GitlabContributionTotals = {
  username: string;
  commits: number;
  mrs: number;
  issues: number;
  meta?: {
    pagesFetched: number;
    perPage: number;
  };
};

const GitlabUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string().optional(),
});

const GitlabEventSchema = z.object({
  id: z.number(),
  action_name: z.string().optional(),
  target_type: z.string().nullable().optional(),
  created_at: z.string(),
  push_data: z
    .object({
      commit_count: z.number().optional(),
    })
    .optional(),
});


function cleanBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function toIso8601(input: DateLike): string {
  if (input instanceof Date) return input.toISOString();
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? String(input) : d.toISOString();
}

function startOfUtcDay(d: DateLike): Date {
  const date = d instanceof Date ? new Date(d) : new Date(d);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

function addDaysUTC(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}


/**
 * GET wrapper with:
 *  - PRIVATE-TOKEN header (preferred) or Authorization: Bearer
 *  - 15s timeout
 *  - 429 handling + honor Retry-After (1..10s clamp), one retry
 */
async function glGet(
  baseUrl: string,
  path: string,
  token?: string,
  query?: Record<string, string | number | undefined>,
): Promise<Response> {
  const u = new URL(cleanBaseUrl(baseUrl) + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['PRIVATE-TOKEN'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 15_000);

  try {
    let res = await fetch(u.toString(), { headers, signal: controller.signal });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After') || 1);
      const waitSec = Math.min(Math.max(retryAfter, 1), 10);
      await sleep(waitSec * 1000);
      res = await fetch(u.toString(), { headers, signal: controller.signal });
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`GitLab HTTP ${res.status}: ${text || res.statusText} (${u})`);
    }

    return res;
  } finally {
    clearTimeout(to);
  }
}


export async function resolveGitlabUserId(
  username: string,
  baseUrl: string,
  token?: string,
): Promise<{ id: number; username: string } | null> {
  const res = await glGet(baseUrl, `/api/v4/users`, token, { username, per_page: 1 });
  const json = await res.json();
  const arr = z.array(GitlabUserSchema).parse(json);
  if (!arr.length) return null;
  return { id: arr[0]!.id, username: arr[0]!.username };
}

type FetchEventsOptions = {
  afterIso: string;
  beforeIso: string;
  perPage?: number;
  maxPages?: number;
};

async function fetchUserEventsByWindow(
  userId: number,
  baseUrl: string,
  token: string | undefined,
  opts: FetchEventsOptions,
): Promise<{ events: z.infer<typeof GitlabEventSchema>[]; pagesFetched: number; perPage: number }> {
  const perPage = Math.min(Math.max(opts.perPage ?? 100, 20), 100);
  const maxPages = Math.min(Math.max(opts.maxPages ?? 10, 1), 50);
  const lowerMs = new Date(opts.afterIso).getTime();
  const upperMs = new Date(opts.beforeIso).getTime();

  let page = 1;
  let pagesFetched = 0;
  const out: z.infer<typeof GitlabEventSchema>[] = [];

  while (true) {
    const res = await glGet(baseUrl, `/api/v4/users/${userId}/events`, token, {
      after: opts.afterIso,
      before: opts.beforeIso,
      per_page: perPage,
      page,
      scope: 'all',
    });
    pagesFetched++;

    const json = await res.json();
    const events = z.array(GitlabEventSchema).parse(json);

    const filtered = events.filter((e) => {
      const t = new Date(e.created_at).getTime();
      return t >= lowerMs && t < upperMs;
    });
    out.push(...filtered);

    if (
      filtered.length === 0 &&
      events.length > 0 &&
      Math.max(...events.map((e) => new Date(e.created_at).getTime())) < lowerMs
    ) {
      break;
    }

    const nextPageHeader = res.headers.get('X-Next-Page');
    const hasNext = !!nextPageHeader && nextPageHeader !== '0';
    if (!hasNext) break;

    const next = Number(nextPageHeader);
    if (!Number.isFinite(next) || next <= 0) break;
    if (next > maxPages) break;

    page = next;
  }

  return { events: out, pagesFetched, perPage };
}

function reduceContributionCounts(events: z.infer<typeof GitlabEventSchema>[]) {
  let commits = 0;
  let mrs = 0;
  let issues = 0;

  for (const e of events) {
    const target = e.target_type ?? undefined;
    const action = (e.action_name || '').toLowerCase();

    if (e.push_data && typeof e.push_data.commit_count === 'number') {
      if (action.includes('push')) {
        commits += Math.max(0, e.push_data.commit_count || 0);
        continue;
      }
    }

    if (target === 'MergeRequest' && action === 'opened') {
      mrs += 1;
      continue;
    }

    if (target === 'Issue' && action === 'opened') {
      issues += 1;
      continue;
    }
  }

  return { commits, mrs, issues };
}

export async function getGitlabContributionTotals(
  username: string,
  range: DateRange,
  baseUrl: string,
  token?: string,
): Promise<GitlabContributionTotals> {
  const fromIso = toIso8601(range.from);
  const toIso = toIso8601(range.to);

  const user = await resolveGitlabUserId(username, baseUrl, token);
  if (!user) {
    return { username, commits: 0, mrs: 0, issues: 0 };
  }

  const { events, pagesFetched, perPage } = await fetchUserEventsByWindow(user.id, baseUrl, token, {
    afterIso: fromIso,
    beforeIso: toIso,
    perPage: 100,
    maxPages: 25,
  });

  const totals = reduceContributionCounts(events);
  return {
    username: user.username,
    ...totals,
    meta: { pagesFetched, perPage },
  };
}

export async function getGitlabContributionTotalsForDay(
  username: string,
  dayUtc: DateLike,
  baseUrl: string,
  token?: string,
): Promise<GitlabContributionTotals> {
  const start = startOfUtcDay(dayUtc);
  const end = addDaysUTC(start, 1);
  return getGitlabContributionTotals(username, { from: start, to: end }, baseUrl, token);
}
