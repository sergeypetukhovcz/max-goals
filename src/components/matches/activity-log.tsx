"use client";

import type { Goal } from "@/lib/types";

interface ActivityLogProps {
  goals: Goal[];
  onEditGoal?: (goal: Goal) => void;
}

function formatSeconds(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ActivityLog({ goals, onEditGoal }: ActivityLogProps) {
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

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Aktivita</h3>
      <div className="space-y-2">
        {sorted.map((goal) => (
          <button
            key={goal.id}
            onClick={() => onEditGoal?.(goal)}
            className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-left transition-colors hover:border-zinc-700"
          >
            <div
              className={`h-2 w-2 rounded-full ${
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
          </button>
        ))}
      </div>
    </div>
  );
}
