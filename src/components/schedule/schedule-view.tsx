"use client";

import { useState } from "react";
import Link from "next/link";
import type { Tournament, Player, Teammate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { TournamentForm } from "./tournament-form";

export type TeammateWithTeam = Teammate & { team: { name: string } | null };

export interface PlannedMatch {
  id: string;
  home_team_name: string;
  away_team_name: string;
  status: string;
  season: string;
  current_period: number;
  periods_count: number;
  created_at: string;
}

interface ScheduleViewProps {
  tournaments: Tournament[];
  standaloneMatches: PlannedMatch[];
  players: Player[];
  teammates: TeammateWithTeam[];
}

const STATUS_LABEL: Record<string, string> = {
  not_started: "Nezahájený",
  in_progress: "Probíhá",
  paused: "Pauza",
};

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const fmt = (d: string) => new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
  if (end && end !== start) return `${fmt(start)} – ${fmt(end)}`;
  return fmt(start);
}

export function ScheduleView({ tournaments, standaloneMatches, players, teammates }: ScheduleViewProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="rounded-lg p-1 text-zinc-400 hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="flex-1 text-xl font-bold text-white">Turnaje a zápasy</h2>
      </div>

      {/* Tournaments */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Turnaje</h3>
          <Button size="sm" onClick={() => setShowForm(true)}>+ Nový turnaj</Button>
        </div>
        {tournaments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 py-6 text-center text-sm text-zinc-500">
            Zatím žádné turnaje
          </p>
        ) : (
          <div className="space-y-2">
            {tournaments.map((t) => {
              const dateRange = formatDateRange(t.start_date, t.end_date);
              return (
                <Link
                  key={t.id}
                  href={`/schedule/${t.id}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497M18.75 4.72c1.297.164 2.223.78 2.223 1.78 0 1.5-2.086 2.716-4.66 3.03" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{t.name}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      {t.location && <span className="truncate">{t.location}</span>}
                      {t.location && dateRange && <span>·</span>}
                      {dateRange && <span>{dateRange}</span>}
                    </div>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Standalone planned matches */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Naplánované zápasy</h3>
          <Link href="/matches/new">
            <Button size="sm">+ Nový zápas</Button>
          </Link>
        </div>
        {standaloneMatches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 py-6 text-center text-sm text-zinc-500">
            Žádné rozehrané ani připravené zápasy mimo turnaj
          </p>
        ) : (
          <div className="space-y-2">
            {standaloneMatches.map((m) => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {m.home_team_name} <span className="text-zinc-500">vs</span> {m.away_team_name}
                  </p>
                  <p className="text-xs text-zinc-400">{m.season}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    m.status === "not_started"
                      ? "bg-zinc-700 text-zinc-300"
                      : "bg-red-600/20 text-red-400"
                  }`}
                >
                  {STATUS_LABEL[m.status] ?? m.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <TournamentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        players={players}
        teammates={teammates}
      />
    </div>
  );
}
