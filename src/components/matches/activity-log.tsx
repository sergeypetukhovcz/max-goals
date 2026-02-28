"use client";

import type { Goal } from "@/lib/types";

interface ActivityLogProps {
  goals: Goal[];
  onEditGoal?: (goal: Goal) => void;
  onDeleteGoal?: (goalId: string) => void;
}

function formatSeconds(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ActivityLog({ goals, onEditGoal, onDeleteGoal }: ActivityLogProps) {
  if (goals.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-zinc-500">Zatím žádné góly</p>
      </div>
    );
  }

  const sorted = [...goals].sort((a, b) => {
    if (a.period !== b.period) return b.period - a.period;
    if (a.match_time_seconds === null && b.match_time_seconds === null) return 0;
    if (a.match_time_seconds === null) return -1;
    if (b.match_time_seconds === null) return 1;
    return b.match_time_seconds - a.match_time_seconds;
  });

  function handleDelete(e: React.MouseEvent, goalId: string) {
    e.stopPropagation();
    if (onDeleteGoal) onDeleteGoal(goalId);
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Aktivita</h3>
      <div className="space-y-2">
        {sorted.map((goal) => (
          <div
            key={goal.id}
            className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5"
          >
            <div
              className={`h-2 w-2 rounded-full flex-shrink-0 ${
                goal.is_home_goal ? "bg-red-500" : "bg-blue-500"
              }`}
            />
            <span className="text-xs font-mono text-zinc-500 w-10">
              {formatSeconds(goal.match_time_seconds)}
            </span>
            <span className="text-xs text-zinc-500">T{goal.period}</span>
            <span className="text-sm text-white flex-1 truncate">
              {goal.scorer_name ?? "Neznámý střelec"}
            </span>
            {goal.note && (
              <span className="text-xs text-zinc-500 truncate max-w-[80px]">{goal.note}</span>
            )}
            {/* Edit button */}
            {onEditGoal && (
              <button
                onClick={() => onEditGoal(goal)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors flex-shrink-0"
                title="Upravit gól"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {/* Delete button */}
            {onDeleteGoal && (
              <button
                onClick={(e) => handleDelete(e, goal.id)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-600/20 hover:text-red-400 transition-colors flex-shrink-0"
                title="Smazat gól"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
