import { createClient } from "@/lib/supabase/server";
import { TeamList } from "@/components/teams/team-list";

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });

  return <TeamList teams={teams ?? []} />;
}
