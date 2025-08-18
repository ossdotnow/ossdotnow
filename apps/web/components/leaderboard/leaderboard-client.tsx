"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

// shadcn/ui
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@workspace/ui/components/select";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@workspace/ui/components/table";
import { Card, CardContent } from "@workspace/ui/components/card";

type WindowKey = "all" | "30d" | "365d";

type TopEntry = { userId: string; score: number };
type DetailsEntry = { userId: string; github: number; gitlab: number; total: number };

type LeaderRow = {
  userId: string;
  total: number;
  github: number;
  gitlab: number;
};

type SortKey = "rank" | "userId" | "total" | "github" | "gitlab";
type SortDir = "asc" | "desc";

async function fetchTop(window: WindowKey, limit: number, cursor = 0) {
  const url = `/api/leaderboard?window=${window}&provider=combined&limit=${limit}&cursor=${cursor}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch leaderboard: ${await res.text()}`);
  return (await res.json()) as {
    ok: boolean;
    entries: TopEntry[];
    nextCursor: number | null;
    source: "redis" | "db";
  };
}

async function fetchDetails(window: WindowKey, userIds: string[]) {
  if (userIds.length === 0) return { ok: true, window, entries: [] as DetailsEntry[] };
  const res = await fetch(`/api/leaderboard/details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ window, userIds }),
  });
  if (!res.ok) throw new Error(`Failed to fetch details: ${await res.text()}`);
  return (await res.json()) as { ok: true; window: WindowKey; entries: DetailsEntry[] };
}

export default function LeaderboardClient({ initialWindow }: { initialWindow: WindowKey }) {
  const router = useRouter();
  const search = useSearchParams();

  const [window, setWindow] = React.useState<WindowKey>(initialWindow);
  const [rows, setRows] = React.useState<LeaderRow[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [limit, setLimit] = React.useState<number>(25);
  const [cursor, setCursor] = React.useState<number>(0);
  const [nextCursor, setNextCursor] = React.useState<number | null>(null);

  const [sortKey, setSortKey] = React.useState<SortKey>("rank");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  const doFetch = React.useCallback(async (w: WindowKey, lim: number, cur: number) => {
    setLoading(true);
    setError(null);
    try {
      const top = await fetchTop(w, lim, cur);
      const ids = top.entries.map((e) => e.userId);
      const details = await fetchDetails(w, ids);

      const detailMap = new Map(details.entries.map((d) => [d.userId, d]));
      const merged: LeaderRow[] = top.entries.map((e) => {
        const d = detailMap.get(e.userId);
        return {
          userId: e.userId,
          total: d?.total ?? e.score ?? 0,
          github: d?.github ?? 0,
          gitlab: d?.gitlab ?? 0,
        };
      });

      setRows(merged);
      setNextCursor(top.nextCursor);
    } catch (err: any) {
      setError(String(err?.message || err));
      setRows([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { doFetch(window, limit, cursor); }, [window, limit, cursor, doFetch]);

  // keep URL in sync with window
  React.useEffect(() => {
    const params = new URLSearchParams(search?.toString?.() || "");
    params.set("window", window);
    router.replace(`/leaderboard?${params.toString()}`);
  }, [window]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "rank" ? "asc" : "desc"); }
  }

  const sortedRows = React.useMemo(() => {
    if (!rows) return [];
    const copy = [...rows];
    copy.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortKey) {
        case "userId": av = a.userId; bv = b.userId; break;
        case "total": av = a.total; bv = b.total; break;
        case "github": av = a.github; bv = b.github; break;
        case "gitlab": av = a.gitlab; bv = b.gitlab; break;
        case "rank": default: av = 0; bv = 0; break; // original rank order
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return sortKey === "rank" ? rows : copy;
  }, [rows, sortKey, sortDir]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Window</label>
              <Select value={window} onValueChange={(v: WindowKey) => { setCursor(0); setWindow(v); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Time window" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="365d">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Page size</label>
              <Input
                className="w-[88px]"
                type="number"
                min={5}
                max={100}
                value={limit}
                onChange={(e) => {
                  const n = Math.max(5, Math.min(100, Number(e.target.value || 25)));
                  setLimit(n);
                  setCursor(0);
                }}
              />
              <Button
                variant="secondary"
                onClick={() => doFetch(window, limit, 0)}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px] cursor-pointer" onClick={() => toggleSort("rank")}>
                    Rank {sortKey === "rank" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead className="min-w-[260px] cursor-pointer" onClick={() => toggleSort("userId")}>
                    User {sortKey === "userId" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("total")}>
                    Total {sortKey === "total" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("github")}>
                    GitHub {sortKey === "github" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("gitlab")}>
                    GitLab {sortKey === "gitlab" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}

                {!loading && error && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && sortedRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No entries yet.
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && sortedRows.map((r, idx) => (
                  <TableRow key={r.userId}>
                    <TableCell className="font-medium">{(cursor || 0) + idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                        <div className="truncate">
                          <div className="font-medium truncate">{r.userId}</div>
                          <div className="text-xs text-muted-foreground">UUID</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{r.total}</TableCell>
                    <TableCell className="text-right">{r.github}</TableCell>
                    <TableCell className="text-right">{r.gitlab}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={loading || cursor === 0}
          onClick={() => setCursor(Math.max(0, cursor - limit))}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          {rows?.length || 0} rows • {window.toUpperCase()}
        </div>
        <Button
          disabled={loading || nextCursor == null}
          onClick={() => { if (nextCursor != null) setCursor(nextCursor); }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
