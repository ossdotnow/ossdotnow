import LeaderboardClient from "@/components/leaderboard/leaderboard-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


type WindowKey = "all" | "30d" | "365d";

function getWindow(searchParams?: Record<string, string | string[] | undefined>): WindowKey {
  const w = (searchParams?.window as string) || "30d";
  return w === "all" || w === "30d" || w === "365d" ? (w as WindowKey) : "30d";
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const window = getWindow(searchParams);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 mt-12">
        <h1 className="text-3xl font-bold tracking-tight">Global Leaderboard</h1>
        <p className="text-muted-foreground">
          Top contributors across GitHub and GitLab.
        </p>
      </div>
      <LeaderboardClient initialWindow={window} />
    </div>
  );
}
