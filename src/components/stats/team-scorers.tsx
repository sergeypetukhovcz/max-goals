"use client";

import { useState } from "react";
import { ScorerTable } from "@/components/stats/scorer-table";
import { scorerTotals, UNKNOWN_SCORER, type ScorerGoal } from "@/lib/scorer-stats";

export interface TeamScorerMatch {
  id: string;
  season: string;
  /** Počet hráčů na naší straně nominace. */
  rosterSize: number;
  /** Góly našeho týmu s vyplněným střelcem. */
  goals: ScorerGoal[];
}

function matchesWord(n: number): string {
  return n === 1 ? "zápasu" : "zápasů";
}

/**
 * Střelci týmu napříč zápasy s filtrem sezóny a volbou "jen zápasy s celou
 * soupiskou" — tedy zápasy, kde byl nominován i někdo další než jen jeden hráč,
 * aby šlo Maximovy výsledky srovnat se zbytkem týmu.
 */
export function TeamScorers({ matches }: { matches: TeamScorerMatch[] }) {
  const seasons = [...new Set(matches.map((m) => m.season).filter(Boolean))].sort().reverse();
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [fullRosterOnly, setFullRosterOnly] = useState(false);

  const filtered = matches.filter(
    (m) =>
      (selectedSeason === null || m.season === selectedSeason) &&
      (!fullRosterOnly || m.rosterSize > 1)
  );
  const withScorers = filtered.filter((m) => m.goals.length > 0);
  const rows = scorerTotals(withScorers.flatMap((m) => m.goals)).filter((r) => r.name !== UNKNOWN_SCORER);

  if (!matches.some((m) => m.goals.length > 0)) return null;

  return (
    <div className="mt-8 space-y-3">
      <h3 className="text-base font-bold text-white">Střelci týmu</h3>

      {seasons.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {[null, ...seasons].map((season) => (
            <button
              key={season ?? "all"}
              onClick={() => setSelectedSeason(season)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedSeason === season ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {season ?? "Vše"}
            </button>
          ))}
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={fullRosterOnly}
          onChange={(e) => setFullRosterOnly(e.target.checked)}
          className="h-4 w-4 accent-red-600"
        />
        Jen zápasy s nominací celého týmu
      </label>

      {rows.length > 0 ? (
        <ScorerTable rows={rows} title={selectedSeason ? `Góly — ${selectedSeason}` : "Góly"} />
      ) : (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
          Pro tento výběr nejsou zapsané žádné góly se střelcem.
        </p>
      )}

      <p className="text-xs text-zinc-500">
        Statistika z {withScorers.length} {matchesWord(withScorers.length)} s vyplněnými střelci
        {filtered.length > 0 && ` (z celkem ${filtered.length} odehraných)`}.
        {fullRosterOnly
          ? " Počítají se jen zápasy, kde byl nominován víc než jeden hráč."
          : " Starší zápasy střelce zapsané nemají, proto čísla nejsou úplná."}
      </p>
    </div>
  );
}
