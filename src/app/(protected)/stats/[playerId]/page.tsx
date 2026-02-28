import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MatchHistory } from "@/components/stats/match-history";

export default async function PlayerStatsPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (!player) redirect("/stats");

  // Get all match_players entries for this player
  const { data: matchPlayerEntries } = await supabase
    .from("match_players")
    .select("match_id")
    .eq("player_id", playerId);

  const matchIds = (matchPlayerEntries ?? []).map((mp) => mp.match_id);

  let matches: Array<{
    id: string;
    home_team_name: string;
    away_team_name: string;
    created_at: string;
    status: string;
    season: string;
  }> = [];
  let allGoals: Array<{
    match_id: string;
    is_home_goal: boolean;
    scorer_player_id: string | null;
  }> = [];

  if (matchIds.length > 0) {
    const { data: matchData } = await supabase
      .from("matches")
      .select("id, home_team_name, away_team_name, created_at, status, season")
      .in("id", matchIds)
      .order("created_at", { ascending: false });
    matches = matchData ?? [];

    const { data: goalData } = await supabase
      .from("goals")
      .select("match_id, is_home_goal, scorer_player_id")
      .in("match_id", matchIds);
    allGoals = goalData ?? [];
  }

  // Total goals by this player
  const totalGoals = allGoals.filter((g) => g.scorer_player_id === playerId).length;
  const totalMatches = matches.length;
  const avgGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/stats" className="rounded-lg p-1 text-zinc-400 hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">
            {player.first_name} {player.last_name}
            {player.jersey_number !== null && (
              <span className="ml-2 text-zinc-400">#{player.jersey_number}</span>
            )}
          </h2>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalMatches}</p>
          <p className="text-xs text-zinc-400">Zápasů</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{totalGoals}</p>
          <p className="text-xs text-zinc-400">Gólů</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{avgGoals}</p>
          <p className="text-xs text-zinc-400">Gólů/zápas</p>
        </div>
      </div>

      {/* Match history */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Historie zápasů</h3>
        <MatchHistory matches={matches} allGoals={allGoals} playerId={playerId} />
      </div>
    </div>
  );
}
