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

function timerStorageKey(matchId: string) {
  return `match_timer_${matchId}`;
}

function saveTimerState(matchId: string, elapsed: number, running: boolean) {
  try {
    localStorage.setItem(
      timerStorageKey(matchId),
      JSON.stringify({ elapsed, running, savedAt: running ? Date.now() : null })
    );
  } catch {}
}

function loadTimerState(matchId: string): { elapsed: number; running: boolean } | null {
  try {
    const raw = localStorage.getItem(timerStorageKey(matchId));
    if (!raw) return null;
    const { elapsed, running, savedAt } = JSON.parse(raw);
    if (running && savedAt) {
      // Restore elapsed time accounting for time passed since save
      return { elapsed: elapsed + (Date.now() - savedAt), running: true };
    }
    return { elapsed, running };
  } catch {
    return null;
  }
}

function clearTimerState(matchId: string) {
  try {
    localStorage.removeItem(timerStorageKey(matchId));
  } catch {}
}

export function LiveMatch({ match: initialMatch, goals: initialGoals, matchPlayers, homeTeam, awayTeam }: LiveMatchProps) {
  const router = useRouter();
  const supabase = createClient();
  const workerRef = useRef<Worker | null>(null);

  const [match, setMatch] = useState(initialMatch);
  const [goals, setGoals] = useState(initialGoals);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalIsHome, setGoalIsHome] = useState(true);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [matchNotes, setMatchNotes] = useState(match.notes ?? "");
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const homeScore = goals.filter((g) => g.is_home_goal).length;
  const awayScore = goals.filter((g) => !g.is_home_goal).length;

  const homeColor = homeTeam
    ? (homeTeam.default_color === "primary" ? homeTeam.color_primary : homeTeam.color_secondary)
    : "#cc0000";
  const awayColor = awayTeam
    ? (awayTeam.default_color === "primary" ? awayTeam.color_primary : awayTeam.color_secondary)
    : "#0044cc";

  const hasTimer = match.period_duration_minutes !== null;

  // Init Web Worker + restore timer state
  useEffect(() => {
    if (!hasTimer) return;

    workerRef.current = new Worker("/match-timer-worker.js");
    workerRef.current.onmessage = (e) => {
      if (e.data.type === "tick") setElapsed(e.data.elapsed);
      if (e.data.type === "paused") setElapsed(e.data.elapsed);
      if (e.data.type === "reset") setElapsed(0);
    };

    // Restore timer state if match is in_progress
    if (initialMatch.status === "in_progress") {
      const saved = loadTimerState(initialMatch.id);
      if (saved) {
        workerRef.current.postMessage({ type: "start", elapsed: saved.elapsed });
        setElapsed(saved.elapsed);
        setTimerRunning(true);
      }
    } else if (initialMatch.status === "paused") {
      const saved = loadTimerState(initialMatch.id);
      if (saved) {
        setElapsed(saved.elapsed);
      }
    }

    return () => {
      workerRef.current?.postMessage({ type: "stop" });
      workerRef.current?.terminate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTimer]);

  const startTimer = useCallback((fromElapsed?: number) => {
    const startFrom = fromElapsed ?? elapsed;
    workerRef.current?.postMessage({ type: "start", elapsed: startFrom });
    setTimerRunning(true);
    saveTimerState(initialMatch.id, startFrom, true);
  }, [elapsed, initialMatch.id]);

  const pauseTimer = useCallback(() => {
    workerRef.current?.postMessage({ type: "pause" });
    setTimerRunning(false);
    setElapsed((prev) => {
      saveTimerState(initialMatch.id, prev, false);
      return prev;
    });
  }, [initialMatch.id]);

  const resetTimer = useCallback(() => {
    workerRef.current?.postMessage({ type: "reset" });
    setElapsed(0);
    setTimerRunning(false);
    saveTimerState(initialMatch.id, 0, false);
  }, [initialMatch.id]);

  async function updateMatchStatus(status: string, updates: Record<string, unknown> = {}) {
    const { data, error } = await supabase
      .from("matches")
      .update({ status, ...updates })
      .eq("id", match.id)
      .select()
      .single();
    if (error) {
      setError("Nepodařilo se aktualizovat stav zápasu");
      return false;
    }
    if (data) setMatch(data);
    return true;
  }

  async function handleStartMatch() {
    const ok = await updateMatchStatus("in_progress");
    if (ok && hasTimer) startTimer(0);
  }

  async function handlePauseMatch() {
    if (match.status === "in_progress") {
      const ok = await updateMatchStatus("paused");
      if (ok && hasTimer) pauseTimer();
    } else if (match.status === "paused") {
      const ok = await updateMatchStatus("in_progress");
      if (ok && hasTimer) startTimer();
    }
  }

  async function handleEndPeriod() {
    if (hasTimer) resetTimer();
    if (match.current_period < match.periods_count) {
      await updateMatchStatus("paused", { current_period: match.current_period + 1 });
    } else {
      await updateMatchStatus("paused");
    }
  }

  async function handleFinishMatch() {
    if (hasTimer) pauseTimer();
    const ok = await updateMatchStatus("finished");
    if (ok) {
      clearTimerState(initialMatch.id);
    } else {
      // Revert timer if save failed
      if (hasTimer && match.status === "in_progress") startTimer();
    }
    setShowFinishConfirm(false);
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
      const { data, error } = await supabase
        .from("goals")
        .update({ ...goalData, note: goalData.note })
        .eq("id", editingGoal.id)
        .select()
        .single();
      if (error) {
        setError("Nepodařilo se uložit gól");
        return;
      }
      if (data) {
        setGoals((prev) => prev.map((g) => (g.id === data.id ? data : g)));
      }
    } else {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          match_id: match.id,
          period: match.current_period,
          match_time_seconds: currentTimeSeconds,
          ...goalData,
        })
        .select()
        .single();
      if (error) {
        setError("Nepodařilo se přidat gól");
        return;
      }
      if (data) {
        setGoals((prev) => [...prev, data]);
      }
    }
    setGoalModalOpen(false);
    setEditingGoal(null);
  }

  async function handleDeleteGoal(goalId: string) {
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    if (error) {
      setError("Nepodařilo se smazat gól");
      return;
    }
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setGoalModalOpen(false);
    setEditingGoal(null);
  }

  async function handleSaveNotes() {
    const { error } = await supabase
      .from("matches")
      .update({ notes: matchNotes.trim() || null })
      .eq("id", match.id);
    if (error) {
      setError("Nepodařilo se uložit poznámky");
      return;
    }
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

      {/* Error banner */}
      {error && (
        <div className="mx-4 flex items-center justify-between rounded-lg border border-red-800 bg-red-950 px-4 py-2">
          <span className="text-sm text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

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

        {isActive && !showFinishConfirm && (
          <Button variant="ghost" fullWidth onClick={() => setShowFinishConfirm(true)} className="!text-zinc-500">
            Ukončit zápas
          </Button>
        )}

        {isActive && showFinishConfirm && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3">
            <p className="text-sm text-center text-zinc-300">Opravdu ukončit zápas?</p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowFinishConfirm(false)}>
                Zrušit
              </Button>
              <Button variant="danger" fullWidth onClick={handleFinishMatch}>
                Ukončit
              </Button>
            </div>
          </div>
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
