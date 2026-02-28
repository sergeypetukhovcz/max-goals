import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MatchDetail } from "@/components/matches/match-detail";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (!match) redirect("/dashboard");

  const [goalsRes, matchPlayersRes, teamsRes] = await Promise.all([
    supabase.from("goals").select("*").eq("match_id", id).order("period").order("match_time_seconds"),
    supabase.from("match_players").select("*, player:players(*), teammate:teammates(*)").eq("match_id", id),
    supabase.from("teams").select("*").order("name"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/stats" className="rounded-lg p-1 text-zinc-400 hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-xl font-bold text-white">Detail zápasu</h2>
      </div>

      <MatchDetail
        match={match}
        goals={goalsRes.data ?? []}
        matchPlayers={matchPlayersRes.data ?? []}
        teams={teamsRes.data ?? []}
      />
    </div>
  );
}
