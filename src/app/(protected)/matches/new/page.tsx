import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NewMatchForm } from "@/components/matches/new-match-form";

export default async function NewMatchPage() {
  const supabase = await createClient();

  const [teamsRes, playersRes, teammatesRes] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase.from("players").select("*").order("first_name"),
    supabase.from("teammates").select("*").order("first_name"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="rounded-lg p-1 text-zinc-400 hover:text-white">
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
      />
    </div>
  );
}
