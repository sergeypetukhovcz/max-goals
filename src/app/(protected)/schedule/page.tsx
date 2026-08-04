import { createClient } from "@/lib/supabase/server";
import { ScheduleView } from "@/components/schedule/schedule-view";

export default async function SchedulePage() {
  const supabase = await createClient();

  const [tournamentsRes, matchesRes, playersRes, teammatesRes] = await Promise.all([
    supabase.from("tournaments").select("*").order("start_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
    // Standalone planned matches (not in a tournament, not yet finished).
    supabase
      .from("matches")
      .select("id, home_team_name, away_team_name, status, season, current_period, periods_count, created_at")
      .is("tournament_id", null)
      .neq("status", "finished")
      .order("created_at", { ascending: false }),
    supabase.from("players").select("*").order("last_name"),
    supabase.from("teammates").select("*, team:teams(name)").order("last_name"),
  ]);

  return (
    <ScheduleView
      tournaments={tournamentsRes.data ?? []}
      standaloneMatches={matchesRes.data ?? []}
      players={playersRes.data ?? []}
      teammates={teammatesRes.data ?? []}
    />
  );
}
