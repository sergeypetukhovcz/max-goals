import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TournamentDetail } from "@/components/schedule/tournament-detail";

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase.from("tournaments").select("*").eq("id", id).single();
  if (!tournament) redirect("/schedule");

  const [nominationRes, matchesRes, playersRes, teammatesRes] = await Promise.all([
    supabase
      .from("tournament_players")
      .select("*, player:players(first_name,last_name,jersey_number), teammate:teammates(first_name,last_name,jersey_number)")
      .eq("tournament_id", id),
    supabase
      .from("matches")
      .select("id, home_team_name, away_team_name, status, current_period, periods_count, created_at, goals(is_home_goal)")
      .eq("tournament_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("players").select("*").order("last_name"),
    supabase.from("teammates").select("*, team:teams(name)").order("last_name"),
  ]);

  return (
    <TournamentDetail
      tournament={tournament}
      nomination={nominationRes.data ?? []}
      matches={matchesRes.data ?? []}
      players={playersRes.data ?? []}
      teammates={teammatesRes.data ?? []}
    />
  );
}
