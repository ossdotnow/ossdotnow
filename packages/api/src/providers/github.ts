const GITHUB_GQL_ENDPOINT = "https://api.github.com/graphql";

import { z } from "zod/v4";

const RateLimitSchema = z
  .object({
    cost: z.number(),
    remaining: z.number(),
    resetAt: z.string(), // ISO datetime
  })
  .optional();

const ContributionsSchema = z.object({
  restrictedContributionsCount: z.number().optional(),
  totalCommitContributions: z.number(),
  totalPullRequestContributions: z.number(),
  totalIssueContributions: z.number(),
});

const UserContribsSchema = z.object({
  id: z.string(),
  login: z.string(),
  contributionsCollection: ContributionsSchema,
});

const GraphQLDataSchema = z.object({
  user: UserContribsSchema.nullable(),
  rateLimit: RateLimitSchema,
});

const GraphQLResponseSchema = z.object({
  data: GraphQLDataSchema.optional(),
  errors: z
    .array(
      z.object({
        message: z.string(),
        type: z.string().optional(),
        path: z.array(z.union([z.string(), z.number()])).optional(),
      }),
    )
    .optional(),
});

export type GithubContributionTotals = {
  login: string;
  commits: number;
  prs: number;
  issues: number;
  rateLimit?: {
    cost: number;
    remaining: number;
    resetAt: string;
  };
};

export type DateLike = string | Date;
export type DateRange = { from: DateLike; to: DateLike };

function toIso8601(input: DateLike): string {
  if (input instanceof Date) return input.toISOString();
  const maybe = new Date(input);
  return isNaN(maybe.getTime()) ? String(input) : maybe.toISOString();
}

function startOfUtcDay(d: DateLike): Date {
  const date = d instanceof Date ? new Date(d) : new Date(d);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function addDaysUTC(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

async function githubGraphQLRequest<T>({
  token,
  query,
  variables,
}: {
  token: string;
  query: string;
  variables: Record<string, unknown>;
}): Promise<T> {
  if (!token) {
    throw new Error("GitHub GraphQL token is required. Pass GITHUB_TOKEN.");
  }

  const res = await fetch(GITHUB_GQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub GraphQL HTTP ${res.status}: ${text || res.statusText}`);
  }

  const json = (await res.json()) as unknown;
  const parsed = GraphQLResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Unexpected GitHub GraphQL response shape");
  }

  if (parsed.data.errors?.length) {
    const msgs = parsed.data.errors.map((e) => e.message).join("; ");
    throw new Error(`GitHub GraphQL error(s): ${msgs}`);
  }

  const data = parsed.data.data;
  if (!data) {
    throw new Error("GitHub GraphQL returned no data");
  }

  return data as T;
}

export async function getGithubContributionTotals(
  login: string,
  range: DateRange,
  token: string,
): Promise<GithubContributionTotals> {
  const query = /* GraphQL */ `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        id
        login
        contributionsCollection(from: $from, to: $to) {
          restrictedContributionsCount
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
        }
      }
      rateLimit {
        cost
        remaining
        resetAt
      }
    }
  `;

  const variables = {
    login,
    from: toIso8601(range.from),
    to: toIso8601(range.to),
  };

  const data = await githubGraphQLRequest<z.infer<typeof GraphQLDataSchema>>({
    token,
    query,
    variables,
  });

  if (!data.user) {
    // If the user/login doesn't exist or is not visible, return zeros.
    return {
      login,
      commits: 0,
      prs: 0,
      issues: 0,
      rateLimit: data.rateLimit ? { ...data.rateLimit } : undefined,
    };
  }

  const cc = data.user.contributionsCollection;
  return {
    login: data.user.login,
    commits: cc.totalCommitContributions,
    prs: cc.totalPullRequestContributions,
    issues: cc.totalIssueContributions,
    rateLimit: data.rateLimit ? { ...data.rateLimit } : undefined,
  };
}

export async function getGithubContributionTotalsForDay(
  login: string,
  dayUtc: DateLike,
  token: string,
): Promise<GithubContributionTotals> {
  const start = startOfUtcDay(dayUtc);
  const end = addDaysUTC(start, 1);
  return getGithubContributionTotals(login, { from: start, to: end }, token);
}
