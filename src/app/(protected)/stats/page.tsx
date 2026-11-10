import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { ScorerTable } from "@/components/stats/scorer-table";
import { deriveOurSide, ourGoals, scorerTotals, UNKNOWN_SCORER, type ScorerGoal } from "@/lib/scorer-stats";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Načte všechny řádky tabulky stránkovaně — jednorázový dotaz naráží na
 * řádkový limit PostgRESTu (výchozí 1000) a tiše by se ořízl.
 */
async function fetchAllRows<T>(supabase: Supabase, table: string, columns: string): Promise<T[]> {
  const PAGE = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from(table)
      .select(columns)
      .order("id")
      .range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    rows.push(...(data as T[]));
    if (data.length < PAGE) break;
  }
  return rows;
}

/**
 * Součet gólů hráčů našeho týmu napříč všemi zápasy. Započítají se jen góly
 * s vyplněným střelcem (střelce se začalo zapisovat až nedávno), proto vracíme
 * i počet zápasů, ze kterých statistika vychází.
 */
async function loadTeamScorers(supabase: Supabase) {
  const [goals, roster, { count: playedCount }] = await Promise.all([
    fetchAllRows<ScorerGoal & { match_id: string }>(
      supabase,
      "goals",
      "id, match_id, is_home_goal, scorer_player_id, scorer_teammate_id, scorer_name"
    ),
    fetchAllRows<{ match_id: string; is_home: boolean | null; is_my_player: boolean }>(
      supabase,
      "match_players",
      "id, match_id, is_home, is_my_player"
    ),
    supabase.from("matches").select("id", { count: "exact", head: true }).neq("status", "not_started"),
  ]);

  const rosterByMatch = new Map<string, typeof roster>();
  for (const r of roster) {
    const list = rosterByMatch.get(r.match_id);
    if (list) list.push(r);
    else rosterByMatch.set(r.match_id, [r]);
  }
  const goalsByMatch = new Map<string, typeof goals>();
  for (const g of goals) {
    const list = goalsByMatch.get(g.match_id);
    if (list) list.push(g);
    else goalsByMatch.set(g.match_id, [g]);
  }

  const counted: ScorerGoal[] = [];
  let matchesWithScorers = 0;
  for (const [matchId, matchGoals] of goalsByMatch) {
    const ours = ourGoals(matchGoals, deriveOurSide(rosterByMatch.get(matchId) ?? [])).filter(
      (g) => g.scorer_player_id || g.scorer_teammate_id || g.scorer_name
    );
    if (ours.length > 0) {
      matchesWithScorers += 1;
      counted.push(...ours);
    }
  }

  return {
    rows: scorerTotals(counted).filter((r) => r.name !== UNKNOWN_SCORER),
    matchesWithScorers,
    playedCount: playedCount ?? 0,
  };
}

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

  const [{ data: matchPlayerRows }, { data: goalRows }, teamScorers] = await Promise.all([
    supabase.from("match_players").select("player_id").in("player_id", playerIds),
    supabase.from("goals").select("scorer_player_id").in("scorer_player_id", playerIds),
    loadTeamScorers(supabase),
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

      {teamScorers.rows.length > 0 && (
        <div className="mt-8">
          <ScorerTable rows={teamScorers.rows} title="Střelci týmu" />
          <p className="mt-2 text-xs text-zinc-500">
            Statistika z {teamScorers.matchesWithScorers}{" "}
            {teamScorers.matchesWithScorers === 1 ? "zápasu" : "zápasů"} s vyplněnými střelci
            {teamScorers.playedCount > 0 && ` (z celkem ${teamScorers.playedCount} odehraných)`}.
            Starší zápasy střelce zapsané nemají, proto čísla nejsou úplná.
          </p>
        </div>
      )}
    </div>
  );
}
