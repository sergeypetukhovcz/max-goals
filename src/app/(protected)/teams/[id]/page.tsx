import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RosterManager } from "@/components/teams/roster-manager";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();

  if (!team) redirect("/teams");

  const { data: roster } = await supabase
    .from("teammates")
    .select("*")
    .eq("team_id", id)
    .order("created_at", { ascending: true });

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("first_name", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teams" className="rounded-lg p-1 text-zinc-400 hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{team.name}</h2>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            {team.city && <span>{team.city}</span>}
            {team.city && team.birth_year && <span>·</span>}
            {team.birth_year && <span>Ročník {team.birth_year}</span>}
          </div>
        </div>
        <div className="flex gap-1">
          <div className="h-8 w-4 rounded-l" style={{ backgroundColor: team.color_primary }} />
          <div className="h-8 w-4 rounded-r" style={{ backgroundColor: team.color_secondary }} />
        </div>
      </div>

      <RosterManager
        teamId={id}
        roster={roster ?? []}
        availablePlayers={players ?? []}
      />
    </div>
  );
}
