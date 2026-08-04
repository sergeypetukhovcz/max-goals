import { createClient } from "@/lib/supabase/server";
import { TeamList } from "@/components/teams/team-list";

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });

  // Teams whose roster includes one of my players — shown at the top of the list.
  const { data: myRosterRows } = await supabase
    .from("teammates")
    .select("team_id")
    .not("player_id", "is", null);
  const myPlayerTeamIds = [...new Set((myRosterRows ?? []).map((r) => r.team_id))];

  return <TeamList teams={teams ?? []} myPlayerTeamIds={myPlayerTeamIds} />;
}
