import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NewMatchForm } from "@/components/matches/new-match-form";

export default async function NewMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ tournament?: string }>;
}) {
  const { tournament: tournamentId } = await searchParams;
  const supabase = await createClient();

  const [teamsRes, playersRes, teammatesRes, tournamentsRes] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase.from("players").select("*").order("first_name"),
    supabase.from("teammates").select("*").order("first_name"),
    supabase.from("tournaments").select("id, name, start_date, end_date").order("start_date", { ascending: false, nullsFirst: false }),
  ]);

  // If arriving from a tournament, preselect its nominated players.
  let initialPlayerIds: string[] = [];
  let initialTeammateIds: string[] = [];
  if (tournamentId) {
    const { data: nomination } = await supabase
      .from("tournament_players")
      .select("player_id, teammate_id")
      .eq("tournament_id", tournamentId);
    initialPlayerIds = (nomination ?? []).filter((n) => n.player_id).map((n) => n.player_id as string);
    initialTeammateIds = (nomination ?? []).filter((n) => n.teammate_id).map((n) => n.teammate_id as string);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={tournamentId ? `/schedule/${tournamentId}` : "/dashboard"} className="rounded-lg p-1 text-zinc-400 hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-xl font-bold text-white">Nový zápas</h2>
      </div>

      <NewMatchForm
        teams={teamsRes.data ?? []}
        players={playersRes.data ?? []}
        teammates={teammatesRes.data ?? []}
        tournaments={tournamentsRes.data ?? []}
        initialTournamentId={tournamentId ?? null}
        initialPlayerIds={initialPlayerIds}
        initialTeammateIds={initialTeammateIds}
      />
    </div>
  );
}
