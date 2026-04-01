import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlayerStats } from "@/components/stats/player-stats";

export default async function PlayerStatsPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (!player) redirect("/stats");

  const { data: matchPlayerEntries } = await supabase
    .from("match_players")
    .select("match_id, is_home")
    .eq("player_id", playerId);

  const matchIds = (matchPlayerEntries ?? []).map((mp) => mp.match_id);
  const playerSideMap = new Map<string, boolean | null>(
    (matchPlayerEntries ?? []).map((mp) => [mp.match_id, mp.is_home ?? null])
  );

  let matches: Array<{
    id: string;
    home_team_name: string;
    away_team_name: string;
    home_team_id: string | null;
    away_team_id: string | null;
    created_at: string;
    status: string;
    season: string;
  }> = [];
  let allGoals: Array<{
    match_id: string;
    is_home_goal: boolean;
    scorer_player_id: string | null;
  }> = [];

  const [matchesResult, goalsResult, teamsResult] = await Promise.all([
    matchIds.length > 0
      ? supabase
          .from("matches")
          .select("id, home_team_name, away_team_name, home_team_id, away_team_id, created_at, status, season")
          .in("id", matchIds)
          .order("created_at", { ascending: false })
      : { data: [] },
    matchIds.length > 0
      ? supabase
          .from("goals")
          .select("match_id, is_home_goal, scorer_player_id")
          .in("match_id", matchIds)
      : { data: [] },
    supabase.from("teams").select("id, name").order("name"),
  ]);

  matches = matchesResult.data ?? [];
  allGoals = goalsResult.data ?? [];
  const teams = teamsResult.data ?? [];

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

      <PlayerStats matches={matches} allGoals={allGoals} playerId={playerId} teams={teams} playerSideMap={Object.fromEntries(playerSideMap)} />
    </div>
  );
}
