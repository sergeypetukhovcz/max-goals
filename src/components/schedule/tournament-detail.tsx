"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { TournamentForm } from "./tournament-form";
import type { TeammateWithTeam } from "./schedule-view";

interface NominationRow {
  id: string;
  player_id: string | null;
  teammate_id: string | null;
  is_my_player: boolean;
  player: { first_name: string; last_name: string; jersey_number: number | null } | null;
  teammate: { first_name: string; last_name: string; jersey_number: number | null } | null;
}

interface TournamentMatch {
  id: string;
  home_team_name: string;
  away_team_name: string;
  status: string;
  current_period: number;
  periods_count: number;
  created_at: string;
  goals: { is_home_goal: boolean }[];
}

interface TournamentDetailProps {
  tournament: Tournament;
  nomination: NominationRow[];
  matches: TournamentMatch[];
  players: Player[];
  teammates: TeammateWithTeam[];
}

const STATUS_LABEL: Record<string, string> = {
  not_started: "Nezahájený",
  in_progress: "Probíhá",
  paused: "Pauza",
  finished: "Dohráno",
};

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const fmt = (d: string) => new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
  if (end && end !== start) return `${fmt(start)} – ${fmt(end)}`;
  return fmt(start);
}

export function TournamentDetail({ tournament, nomination, matches, players, teammates }: TournamentDetailProps) {
  const router = useRouter();
  const supabase = createClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateRange = formatDateRange(tournament.start_date, tournament.end_date);
  const initialPlayerIds = nomination.filter((n) => n.player_id).map((n) => n.player_id as string);
  const initialTeammateIds = nomination.filter((n) => n.teammate_id).map((n) => n.teammate_id as string);

  function nominationName(n: NominationRow): string {
    const src = n.player ?? n.teammate;
    if (!src) return "—";
    const num = src.jersey_number !== null ? ` #${src.jersey_number}` : "";
    return `${src.first_name} ${src.last_name}${num}`;
  }

  async function handleDelete() {
    if (!confirm("Opravdu smazat turnaj? Zápasy zůstanou zachované, jen přestanou spadat pod turnaj.")) return;
    setDeleting(true);
    const { error } = await supabase.from("tournaments").delete().eq("id", tournament.id);
    if (error) {
      setError("Nepodařilo se smazat turnaj");
      setDeleting(false);
      return;
    }
    router.push("/schedule");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/schedule" className="rounded-lg p-1 text-zinc-400 hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="flex-1 truncate text-xl font-bold text-white">{tournament.name}</h2>
        <button onClick={() => setEditOpen(true)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white" title="Upravit turnaj">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
        <div className="space-y-1 text-zinc-300">
          {tournament.location && <p><span className="text-zinc-500">Místo:</span> {tournament.location}</p>}
          {dateRange && <p><span className="text-zinc-500">Datum:</span> {dateRange}</p>}
          <p><span className="text-zinc-500">Sezóna:</span> {tournament.season}</p>
          {tournament.notes && <p className="italic text-zinc-400">{tournament.notes}</p>}
        </div>
      </div>

      {/* Nomination */}
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Nominace {nomination.length > 0 && <span className="text-zinc-600">({nomination.length})</span>}
        </h3>
        {nomination.length === 0 ? (
          <p className="text-sm text-zinc-500">Zatím nikdo nenominován — uprav turnaj a přidej hráče.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {nomination.map((n) => (
              <span
                key={n.id}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  n.is_my_player ? "bg-red-600/20 text-red-300" : "bg-blue-600/20 text-blue-300"
                }`}
              >
                {n.is_my_player && "★ "}{nominationName(n)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Matches */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Zápasy</h3>
          <Link href={`/matches/new?tournament=${tournament.id}`}>
            <Button size="sm">+ Přidat zápas</Button>
          </Link>
        </div>
        {matches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 py-6 text-center text-sm text-zinc-500">
            Zatím žádné zápasy v turnaji
          </p>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => {
              const home = m.goals.filter((g) => g.is_home_goal).length;
              const away = m.goals.filter((g) => !g.is_home_goal).length;
              const href = m.status === "finished" ? `/matches/${m.id}/detail` : `/matches/${m.id}`;
              return (
                <Link
                  key={m.id}
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {m.home_team_name} <span className="font-mono">{home}:{away}</span> {m.away_team_name}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.status === "finished" ? "bg-zinc-800 text-zinc-400" : m.status === "not_started" ? "bg-zinc-700 text-zinc-300" : "bg-red-600/20 text-red-400"
                    }`}
                  >
                    {STATUS_LABEL[m.status] ?? m.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="border-t border-zinc-800 pt-4">
        <Button variant="danger" fullWidth onClick={handleDelete} disabled={deleting}>
          {deleting ? "Mažu turnaj…" : "Smazat turnaj"}
        </Button>
      </div>

      {editOpen && (
        <TournamentForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          players={players}
          teammates={teammates}
          tournament={tournament}
          initialPlayerIds={initialPlayerIds}
          initialTeammateIds={initialTeammateIds}
        />
      )}
    </div>
  );
}
