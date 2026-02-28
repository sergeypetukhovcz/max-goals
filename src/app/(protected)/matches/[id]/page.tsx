import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LiveMatch } from "@/components/matches/live-match";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (!match) redirect("/dashboard");

  const [goalsRes, matchPlayersRes, homeTeamRes, awayTeamRes] = await Promise.all([
    supabase.from("goals").select("*").eq("match_id", id).order("created_at"),
    supabase.from("match_players").select("*, player:players(*), teammate:teammates(*)").eq("match_id", id),
    match.home_team_id ? supabase.from("teams").select("*").eq("id", match.home_team_id).single() : { data: null },
    match.away_team_id ? supabase.from("teams").select("*").eq("id", match.away_team_id).single() : { data: null },
  ]);

  return (
    <LiveMatch
      match={match}
      goals={goalsRes.data ?? []}
      matchPlayers={matchPlayersRes.data ?? []}
      homeTeam={homeTeamRes.data}
      awayTeam={awayTeamRes.data}
    />
  );
}
