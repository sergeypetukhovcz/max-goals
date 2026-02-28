"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Match, Goal, MatchPlayer, Player, Teammate, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { GoalModal } from "./goal-modal";
import { ActivityLog } from "./activity-log";

interface LiveMatchProps {
  match: Match;
  goals: Goal[];
  matchPlayers: (MatchPlayer & { player?: Player; teammate?: Teammate })[];
  homeTeam?: Team | null;
  awayTeam?: Team | null;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function LiveMatch({ match: initialMatch, goals: initialGoals, matchPlayers, homeTeam, awayTeam }: LiveMatchProps) {
  const router = useRouter();
  const supabase = createClient();
  const workerRef = useRef<Worker | null>(null);

  const [match, setMatch] = useState(initialMatch);
  const [goals, setGoals] = useState(initialGoals);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalIsHome, setGoalIsHome] = useState(true);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [matchNotes, setMatchNotes] = useState(match.notes ?? "");

  const homeScore = goals.filter((g) => g.is_home_goal).length;
  const awayScore = goals.filter((g) => !g.is_home_goal).length;

  const homeColor = homeTeam
    ? (homeTeam.default_color === "primary" ? homeTeam.color_primary : homeTeam.color_secondary)
    : "#cc0000";
  const awayColor = awayTeam
    ? (awayTeam.default_color === "primary" ? awayTeam.color_primary : awayTeam.color_secondary)
    : "#0044cc";

  const hasTimer = match.period_duration_minutes !== null;

  // Init Web Worker
  useEffect(() => {
    if (hasTimer) {
      workerRef.current = new Worker("/match-timer-worker.js");
      workerRef.current.onmessage = (e) => {
        if (e.data.type === "tick") setElapsed(e.data.elapsed);
        if (e.data.type === "paused") setElapsed(e.data.elapsed);
        if (e.data.type === "reset") setElapsed(0);
      };
    }
    return () => {
      workerRef.current?.postMessage({ type: "stop" });
      workerRef.current?.terminate();
    };
  }, [hasTimer]);

  const startTimer = useCallback(() => {
    workerRef.current?.postMessage({ type: "start", elapsed });
    setTimerRunning(true);
  }, [elapsed]);

  const pauseTimer = useCallback(() => {
    workerRef.current?.postMessage({ type: "pause" });
    setTimerRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    workerRef.current?.postMessage({ type: "reset" });
    setElapsed(0);
    setTimerRunning(false);
  }, []);

  async function updateMatchStatus(status: string, updates: Record<string, unknown> = {}) {
    const { data } = await supabase
      .from("matches")
      .update({ status, ...updates })
      .eq("id", match.id)
      .select()
      .single();
    if (data) setMatch(data);
  }

  async function handleStartMatch() {
    await updateMatchStatus("in_progress");
    if (hasTimer) startTimer();
  }

  async function handlePauseMatch() {
    if (match.status === "in_progress") {
      await updateMatchStatus("paused");
      if (hasTimer) pauseTimer();
    } else if (match.status === "paused") {
      await updateMatchStatus("in_progress");
      if (hasTimer) startTimer();
    }
  }

  async function handleEndPeriod() {
    if (match.current_period < match.periods_count) {
      if (hasTimer) resetTimer();
      await updateMatchStatus("in_progress", { current_period: match.current_period + 1 });
    } else {
      // Last period — just reset timer, stay active so goals can still be added
      if (hasTimer) resetTimer();
    }
  }

  async function handleFinishMatch() {
    if (!confirm("Opravdu ukončit zápas?")) return;
    if (hasTimer) pauseTimer();
    await updateMatchStatus("finished");
  }

  function openAddGoal(isHome: boolean) {
    setGoalIsHome(isHome);
    setEditingGoal(null);
    setGoalModalOpen(true);
  }

  function openEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setGoalIsHome(goal.is_home_goal);
    setGoalModalOpen(true);
  }

  async function handleSaveGoal(goalData: {
    is_home_goal: boolean;
    scorer_player_id: string | null;
    scorer_teammate_id: string | null;
    scorer_name: string | null;
    note: string | null;
  }) {
    const currentTimeSeconds = hasTimer ? Math.floor(elapsed / 1000) : null;

    if (editingGoal) {
      const { data } = await supabase
        .from("goals")
        .update({
          ...goalData,
          note: goalData.note,
        })
        .eq("id", editingGoal.id)
        .select()
        .single();
      if (data) {
        setGoals((prev) => prev.map((g) => (g.id === data.id ? data : g)));
      }
    } else {
      const { data } = await supabase
        .from("goals")
        .insert({
          match_id: match.id,
          period: match.current_period,
          match_time_seconds: currentTimeSeconds,
          ...goalData,
        })
        .select()
        .single();
      if (data) {
        setGoals((prev) => [...prev, data]);
      }
    }
    setGoalModalOpen(false);
    setEditingGoal(null);
  }

  async function handleDeleteGoal(goalId: string) {
    await supabase.from("goals").delete().eq("id", goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setGoalModalOpen(false);
    setEditingGoal(null);
  }

  async function handleSaveNotes() {
    await supabase.from("matches").update({ notes: matchNotes.trim() || null }).eq("id", match.id);
    setShowNotes(false);
  }

  const isActive = match.status === "in_progress" || match.status === "paused";
  const isFinished = match.status === "finished";

  return (
    <div className="space-y-4 -mx-4 -mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={() => router.push("/dashboard")} className="text-zinc-400 hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-zinc-400">
          Třetina {match.current_period}/{match.periods_count}
        </span>
        <button onClick={() => setShowNotes(true)} className="text-zinc-400 hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </button>
      </div>

      {/* Score display */}
      <div className="flex">
        <div className="flex-1 py-6 text-center" style={{ backgroundColor: homeColor + "20" }}>
          <div className="h-1 mb-3" style={{ backgroundColor: homeColor }} />
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Domácí</p>
          <p className="text-sm font-semibold text-white truncate px-2">{match.home_team_name}</p>
          <p className="text-5xl font-bold text-white mt-2">{homeScore}</p>
        </div>
        <div className="flex items-center px-2">
          <span className="text-2xl font-bold text-zinc-500">:</span>
        </div>
        <div className="flex-1 py-6 text-center" style={{ backgroundColor: awayColor + "20" }}>
          <div className="h-1 mb-3" style={{ backgroundColor: awayColor }} />
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Hosté</p>
          <p className="text-sm font-semibold text-white truncate px-2">{match.away_team_name}</p>
          <p className="text-5xl font-bold text-white mt-2">{awayScore}</p>
        </div>
      </div>

      {/* Goal buttons */}
      {!isFinished && (
        <div className="flex gap-3 px-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => openAddGoal(true)}
            className="!py-3"
          >
            + Gól domácí
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => openAddGoal(false)}
            className="!py-3"
          >
            + Gól hosté
          </Button>
        </div>
      )}

      {/* Timer + Controls */}
      <div className="px-4 space-y-3">
        {hasTimer && (
          <div className="text-center">
            <span className="text-3xl font-mono font-bold text-white">{formatTime(elapsed)}</span>
            {match.period_duration_minutes && (
              <span className="text-sm text-zinc-500 ml-2">/ {match.period_duration_minutes}:00</span>
            )}
          </div>
        )}

        {match.status === "not_started" && (
          <Button fullWidth size="lg" onClick={handleStartMatch}>
            Zahájit zápas
          </Button>
        )}

        {isActive && (
          <div className="flex gap-3">
            <Button
              variant={match.status === "paused" ? "primary" : "secondary"}
              fullWidth
              onClick={handlePauseMatch}
            >
              {match.status === "paused" ? "Pokračovat" : "Pauza"}
            </Button>
            <Button variant="secondary" fullWidth onClick={handleEndPeriod}>
              Konec třetiny
            </Button>
          </div>
        )}

        {isActive && (
          <Button variant="ghost" fullWidth onClick={handleFinishMatch} className="!text-zinc-500">
            Ukončit zápas
          </Button>
        )}

        {isFinished && (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-zinc-400">Zápas ukončen</p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => router.push(`/matches/${match.id}/detail`)}
            >
              Zobrazit detail
            </Button>
          </div>
        )}
      </div>

      {/* Activity log */}
      <div className="px-4">
        <ActivityLog
          goals={goals}
          onEditGoal={openEditGoal}
          onDeleteGoal={(goalId) => handleDeleteGoal(goalId)}
        />
      </div>

      {/* Goal modal */}
      <GoalModal
        open={goalModalOpen}
        onClose={() => { setGoalModalOpen(false); setEditingGoal(null); }}
        isHome={goalIsHome}
        goal={editingGoal}
        matchPlayers={matchPlayers}
        onSave={handleSaveGoal}
        onDelete={editingGoal ? () => handleDeleteGoal(editingGoal.id) : undefined}
      />

      {/* Notes modal */}
      {showNotes && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowNotes(false)} />
          <div className="relative w-full max-w-lg rounded-t-2xl bg-zinc-900 p-6 sm:rounded-2xl sm:m-4">
            <h3 className="text-lg font-semibold text-white mb-4">Poznámky k zápasu</h3>
            <textarea
              value={matchNotes}
              onChange={(e) => setMatchNotes(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none min-h-[100px]"
              placeholder="např. přátelský zápas, turnaj, poznámky..."
            />
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" fullWidth onClick={() => setShowNotes(false)}>Zrušit</Button>
              <Button fullWidth onClick={handleSaveNotes}>Uložit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
