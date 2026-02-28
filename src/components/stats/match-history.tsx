"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MatchData {
  id: string;
  home_team_name: string;
  away_team_name: string;
  created_at: string;
  status: string;
  season: string;
}

interface GoalData {
  match_id: string;
  is_home_goal: boolean;
  scorer_player_id: string | null;
}

interface MatchHistoryProps {
  matches: MatchData[];
  allGoals: GoalData[];
  playerId: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
}

export function MatchHistory({ matches, allGoals, playerId }: MatchHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete(e: React.MouseEvent, matchId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Opravdu smazat tento zápas? Smaže se i všechna související data (góly, hráči v zápase).")) return;
    setDeletingId(matchId);
    try {
      // Cascade delete: goals → match_players → match
      await supabase.from("goals").delete().eq("match_id", matchId);
      await supabase.from("match_players").delete().eq("match_id", matchId);
      await supabase.from("matches").delete().eq("id", matchId);
    } catch {
      // Ignore errors, refresh will show current state
    }
    setDeletingId(null);
    router.refresh();
  }

  if (matches.length === 0) {
    return <p className="py-4 text-center text-sm text-zinc-500">Zatím žádné zápasy</p>;
  }

  return (
    <div className="space-y-2">
      {matches.map((m) => {
        const matchGoals = allGoals.filter((g) => g.match_id === m.id);
        const homeScore = matchGoals.filter((g) => g.is_home_goal).length;
        const awayScore = matchGoals.filter((g) => !g.is_home_goal).length;
        const playerGoalsInMatch = matchGoals.filter((g) => g.scorer_player_id === playerId).length;

        return (
          <div key={m.id} className="relative">
            <Link
              href={`/matches/${m.id}/detail`}
              className={`flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 pr-12 transition-colors hover:border-zinc-700 ${
                deletingId === m.id ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-white truncate">{m.home_team_name}</span>
                  <span className="font-bold text-white">{homeScore}:{awayScore}</span>
                  <span className="font-medium text-white truncate">{m.away_team_name}</span>
                </div>
                <p className="text-xs text-zinc-500">{formatDate(m.created_at)}</p>
              </div>
              {playerGoalsInMatch > 0 && (
                <div className="rounded-full bg-red-600/20 px-2.5 py-1">
                  <span className="text-xs font-bold text-red-400">
                    {playerGoalsInMatch} gól{playerGoalsInMatch > 1 ? "ů" : ""}
                  </span>
                </div>
              )}
            </Link>
            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(e, m.id)}
              disabled={deletingId === m.id}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 hover:bg-red-600/20 hover:text-red-400 disabled:opacity-50 transition-colors"
              title="Smazat zápas"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
