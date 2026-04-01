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
  playerSideMap: Record<string, boolean | null>;
}

type Result = "win" | "loss" | "draw" | "unknown";

function getMatchResult(
  match: MatchData,
  matchGoals: GoalData[],
  playerId: string,
  playerTeamNames: Set<string>,
  playerSideMap: Record<string, boolean | null>
): { result: Result; playerIsHome: boolean | null } {
  const playerGoals = matchGoals.filter((g) => g.scorer_player_id === playerId);
  const homeScore = matchGoals.filter((g) => g.is_home_goal).length;
  const awayScore = matchGoals.filter((g) => !g.is_home_goal).length;

  // Priority: 1. DB is_home field, 2. goals, 3. team name heuristic
  let playerIsHome: boolean | null =
    match.id in playerSideMap ? playerSideMap[match.id] : null;

  if (playerIsHome === null) {
    if (playerGoals.length > 0) {
      playerIsHome = playerGoals[0].is_home_goal;
    } else if (playerTeamNames.has(match.home_team_name)) {
      playerIsHome = true;
    } else if (playerTeamNames.has(match.away_team_name)) {
      playerIsHome = false;
    }
  }

  if (playerIsHome === null) return { result: "unknown", playerIsHome: null };

  const playerScore = playerIsHome ? homeScore : awayScore;
  const opponentScore = playerIsHome ? awayScore : homeScore;

  const result: Result =
    playerScore > opponentScore ? "win" : playerScore < opponentScore ? "loss" : "draw";

  return { result, playerIsHome };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
}

export function MatchHistory({ matches, allGoals, playerId, playerSideMap }: MatchHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete(e: React.MouseEvent, matchId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Opravdu smazat tento zápas? Smaže se i všechna související data (góly, hráči v zápase).")) return;
    setDeletingId(matchId);
    try {
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

  // Derive player's team names from matches where they scored
  const playerTeamNames = new Set<string>();
  for (const m of matches) {
    const playerGoals = allGoals.filter(
      (g) => g.match_id === m.id && g.scorer_player_id === playerId
    );
    if (playerGoals.length > 0) {
      const playerIsHome = playerGoals[0].is_home_goal;
      playerTeamNames.add(playerIsHome ? m.home_team_name : m.away_team_name);
    }
  }

  return (
    <div className="space-y-2">
      {matches.map((m) => {
        const matchGoals = allGoals.filter((g) => g.match_id === m.id);
        const homeScore = matchGoals.filter((g) => g.is_home_goal).length;
        const awayScore = matchGoals.filter((g) => !g.is_home_goal).length;
        const playerGoalsInMatch = matchGoals.filter((g) => g.scorer_player_id === playerId).length;
        const { result, playerIsHome } = getMatchResult(m, matchGoals, playerId, playerTeamNames, playerSideMap);

        const cardStyle =
          result === "win" ? { background: "rgba(20, 83, 45, 0.2)", borderColor: "rgba(22, 101, 52, 0.4)" } :
          result === "loss" ? { background: "rgba(127, 29, 29, 0.2)", borderColor: "rgba(127, 29, 29, 0.4)" } :
          result === "draw" ? { background: "rgba(78, 63, 15, 0.2)", borderColor: "rgba(133, 77, 14, 0.4)" } :
          { background: "", borderColor: "#27272a" };

        return (
          <div key={m.id} className="relative">
            <Link
              href={`/matches/${m.id}/detail`}
              className={`flex flex-col gap-1.5 rounded-xl border p-3 pr-28 transition-colors hover:brightness-110 ${
                deletingId === m.id ? "opacity-50 pointer-events-none" : ""
              }`}
              style={{ background: cardStyle.background, borderColor: cardStyle.borderColor }}
            >
              {/* Top row: teams + score */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 text-sm font-bold text-white">
                  {m.home_team_name}
                </span>

                <span className="shrink-0 font-mono font-bold text-base text-white" style={{ margin: "0 8px" }}>
                  {homeScore}:{awayScore}
                </span>

                <span className="shrink-0 text-sm font-bold text-white">
                  {m.away_team_name}
                </span>
              </div>

              {/* Bottom row: date */}
              <p className="text-xs text-zinc-500">{formatDate(m.created_at)}</p>
            </Link>

            {/* Goals + delete — right side */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-3">
              {playerGoalsInMatch > 0 && (
                <span className="rounded-full bg-red-600/20 px-2.5 py-1 text-xs font-bold text-red-400">
                  {playerGoalsInMatch} {playerGoalsInMatch === 1 ? "gól" : playerGoalsInMatch < 5 ? "góly" : "gólů"}
                </span>
              )}
              <button
                onClick={(e) => handleDelete(e, m.id)}
                disabled={deletingId === m.id}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-600/20 hover:text-red-400 disabled:opacity-50 transition-colors"
                title="Smazat zápas"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
