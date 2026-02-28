"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Match, Goal, MatchPlayer, Player, Teammate, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { GoalModal } from "@/components/matches/goal-modal";
import { EditMatchInfoModal } from "@/components/matches/edit-match-info-modal";

interface MatchDetailProps {
  match: Match;
  goals: Goal[];
  matchPlayers: (MatchPlayer & { player?: Player; teammate?: Teammate })[];
  teams: Team[];
}

function formatSeconds(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

export function MatchDetail({ match: initialMatch, goals: initialGoals, matchPlayers, teams }: MatchDetailProps) {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addGoalIsHome, setAddGoalIsHome] = useState(true);
  const [addGoalPeriod, setAddGoalPeriod] = useState(1);
  const [deletingMatch, setDeletingMatch] = useState(false);
  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const homeGoals = goals.filter((g) => g.is_home_goal);
  const awayGoals = goals.filter((g) => !g.is_home_goal);

  const goalsByPeriod: Record<number, Goal[]> = {};
  for (let i = 1; i <= match.periods_count; i++) {
    goalsByPeriod[i] = goals.filter((g) => g.period === i);
  }

  // --- Goal editing ---
  function openEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setAddGoalIsHome(goal.is_home_goal);
    setGoalModalOpen(true);
  }

  function openAddGoal(period: number, isHome: boolean) {
    setEditingGoal(null);
    setAddGoalIsHome(isHome);
    setAddGoalPeriod(period);
    setGoalModalOpen(true);
  }

  async function handleSaveGoal(data: {
    is_home_goal: boolean;
    scorer_player_id: string | null;
    scorer_teammate_id: string | null;
    scorer_name: string | null;
    note: string | null;
  }) {
    if (editingGoal) {
      const { data: updated, error } = await supabase
        .from("goals")
        .update({
          scorer_player_id: data.scorer_player_id,
          scorer_teammate_id: data.scorer_teammate_id,
          scorer_name: data.scorer_name,
          note: data.note,
        })
        .eq("id", editingGoal.id)
        .select()
        .single();

      if (!error && updated) {
        setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? updated : g)));
      }
    } else {
      const { data: newGoal, error } = await supabase
        .from("goals")
        .insert({
          match_id: match.id,
          period: addGoalPeriod,
          match_time_seconds: null,
          is_home_goal: data.is_home_goal,
          scorer_player_id: data.scorer_player_id,
          scorer_teammate_id: data.scorer_teammate_id,
          scorer_name: data.scorer_name,
          note: data.note,
        })
        .select()
        .single();

      if (!error && newGoal) {
        setGoals((prev) => [...prev, newGoal]);
      }
    }
    setGoalModalOpen(false);
    setEditingGoal(null);
  }

  async function handleDeleteGoal() {
    if (!editingGoal) return;
    await supabase.from("goals").delete().eq("id", editingGoal.id);
    setGoals((prev) => prev.filter((g) => g.id !== editingGoal.id));
    setGoalModalOpen(false);
    setEditingGoal(null);
  }

  // --- Match deletion ---
  async function handleDeleteMatch() {
    if (!confirm("Opravdu smazat tento zápas? Smaže se i všechna související data (góly, hráči v zápase).")) return;
    setDeletingMatch(true);
    try {
      await supabase.from("goals").delete().eq("match_id", match.id);
      await supabase.from("match_players").delete().eq("match_id", match.id);
      await supabase.from("matches").delete().eq("id", match.id);
      router.push("/stats");
      router.refresh();
    } catch {
      setDeletingMatch(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="relative rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
        {/* Edit match info button */}
        <button
          onClick={() => setEditInfoOpen(true)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
          title="Upravit info o zápase"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        <p className="text-xs text-zinc-400 mb-2">{formatDate(match.created_at)}</p>
        <div className="flex items-center justify-center gap-4">
          <div className="text-right flex-1">
            <p className="text-sm font-semibold text-white">{match.home_team_name}</p>
            {match.home_team_id && (
              <p className="text-xs text-green-400/60">✓ tým přiřazen</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white">{homeGoals.length}</span>
            <span className="text-xl text-zinc-500">:</span>
            <span className="text-3xl font-bold text-white">{awayGoals.length}</span>
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-white">{match.away_team_name}</p>
            {match.away_team_id && (
              <p className="text-xs text-green-400/60">✓ tým přiřazen</p>
            )}
          </div>
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          {match.periods_count} {match.periods_count === 1 ? "třetina" : match.periods_count < 5 ? "třetiny" : "třetin"}
          {match.period_duration_minutes && ` × ${match.period_duration_minutes} min`}
        </p>
        {match.season && (
          <p className="text-xs text-zinc-400">Sezóna {match.season}</p>
        )}
        {match.notes && (
          <p className="mt-2 text-sm text-zinc-300 italic">{match.notes}</p>
        )}
      </div>

      {/* Goals by period */}
      {Object.entries(goalsByPeriod).map(([period, periodGoals]) => (
        <div key={period}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-zinc-300">{period}. třetina</h3>
            <div className="flex gap-1">
              <button
                onClick={() => openAddGoal(parseInt(period), true)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-600/20 transition-colors"
                title={`Přidat gól domácí — ${match.home_team_name}`}
              >
                + Domácí
              </button>
              <button
                onClick={() => openAddGoal(parseInt(period), false)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-blue-400 hover:bg-blue-600/20 transition-colors"
                title={`Přidat gól hosté — ${match.away_team_name}`}
              >
                + Hosté
              </button>
            </div>
          </div>
          {periodGoals.length === 0 ? (
            <p className="text-xs text-zinc-500 py-2">Žádné góly</p>
          ) : (
            <div className="space-y-1.5">
              {periodGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => openEditGoal(goal)}
                  className="w-full flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800/50"
                >
                  <div
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      goal.is_home_goal ? "bg-red-500" : "bg-blue-500"
                    }`}
                  />
                  <span className="text-xs font-mono text-zinc-400 w-10">
                    {formatSeconds(goal.match_time_seconds)}
                  </span>
                  <span className="text-sm text-white flex-1 truncate">
                    {goal.scorer_name ?? "Neznámý střelec"}
                  </span>
                  <span className="text-xs text-zinc-400 truncate">
                    {goal.is_home_goal ? match.home_team_name : match.away_team_name}
                  </span>
                  {goal.note && (
                    <span className="text-xs text-zinc-400 italic truncate max-w-20">{goal.note}</span>
                  )}
                  {/* Edit indicator */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-zinc-500 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Delete match button */}
      <div className="pt-4 border-t border-zinc-800">
        <Button
          variant="danger"
          fullWidth
          onClick={handleDeleteMatch}
          disabled={deletingMatch}
        >
          {deletingMatch ? "Mažu zápas..." : "Smazat zápas"}
        </Button>
      </div>

      {/* Goal Modal */}
      <GoalModal
        open={goalModalOpen}
        onClose={() => { setGoalModalOpen(false); setEditingGoal(null); }}
        isHome={addGoalIsHome}
        goal={editingGoal}
        matchPlayers={matchPlayers}
        onSave={handleSaveGoal}
        onDelete={editingGoal ? handleDeleteGoal : undefined}
      />

      {/* Edit Match Info Modal */}
      <EditMatchInfoModal
        open={editInfoOpen}
        onClose={() => setEditInfoOpen(false)}
        match={match}
        teams={teams}
        onSave={(updated) => setMatch(updated)}
      />
    </div>
  );
}
