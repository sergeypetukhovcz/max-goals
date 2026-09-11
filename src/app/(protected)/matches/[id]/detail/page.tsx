import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MatchDetail } from "@/components/matches/match-detail";
import { BackButton } from "@/components/ui/back-button";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (!match) redirect("/dashboard");

  const [goalsRes, matchPlayersRes, playersRes, teammatesRes, teamsRes] = await Promise.all([
    supabase.from("goals").select("*").eq("match_id", id).order("period").order("match_time_seconds"),
    supabase.from("match_players").select("*, player:players(*), teammate:teammates(*)").eq("match_id", id),
    supabase.from("players").select("*").order("first_name"),
    supabase.from("teammates").select("*, team:teams(name)").order("first_name"),
    supabase.from("teams").select("*").order("name"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h2 className="text-xl font-bold text-white">Detail zápasu</h2>
      </div>

      <MatchDetail
        match={match}
        goals={goalsRes.data ?? []}
        matchPlayers={matchPlayersRes.data ?? []}
        players={playersRes.data ?? []}
        teammates={teammatesRes.data ?? []}
        teams={teamsRes.data ?? []}
      />
    </div>
  );
}
