import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default async function StatsPage() {
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("first_name");

  if (!players || players.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-bold text-white">Statistiky</h2>
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          title="Zatím žádné statistiky"
          description="Nejdříve přidej hráče a odehraj zápas"
        />
      </div>
    );
  }

  // Get quick stats for all players in 2 queries
  const playerIds = players.map((p) => p.id);

  const [{ data: matchPlayerRows }, { data: goalRows }] = await Promise.all([
    supabase.from("match_players").select("player_id").in("player_id", playerIds),
    supabase.from("goals").select("scorer_player_id").in("scorer_player_id", playerIds),
  ]);

  const matchCountMap = new Map<string, number>();
  const goalCountMap = new Map<string, number>();

  for (const row of matchPlayerRows ?? []) {
    if (row.player_id) {
      matchCountMap.set(row.player_id, (matchCountMap.get(row.player_id) ?? 0) + 1);
    }
  }
  for (const row of goalRows ?? []) {
    if (row.scorer_player_id) {
      goalCountMap.set(row.scorer_player_id, (goalCountMap.get(row.scorer_player_id) ?? 0) + 1);
    }
  }

  const playerStats = players.map((player) => ({
    ...player,
    matchCount: matchCountMap.get(player.id) ?? 0,
    goalCount: goalCountMap.get(player.id) ?? 0,
  }));

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white">Statistiky</h2>
      <p className="mb-4 text-sm text-zinc-400">Vyber hráče pro zobrazení detailních statistik</p>

      <div className="space-y-3">
        {playerStats.map((player) => (
          <Link
            key={player.id}
            href={`/stats/${player.id}`}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/20 text-sm font-bold text-red-400">
              {player.first_name.charAt(0)}{player.last_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
                  {player.first_name} {player.last_name}
                </span>
                {player.jersey_number !== null && (
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                    #{player.jersey_number}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-white">{player.matchCount}</p>
                <p className="text-xs text-zinc-500">zápasů</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-400">{player.goalCount}</p>
                <p className="text-xs text-zinc-500">gólů</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
