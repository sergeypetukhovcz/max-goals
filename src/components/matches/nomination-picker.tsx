"use client";

import { useState } from "react";
import type { Player, Teammate } from "@/lib/types";

export type TeammateOption = Teammate & { team?: { name: string } | null };

interface NominationPickerProps {
  players: Player[];
  teammates: TeammateOption[];
  selectedPlayerIds: string[];
  selectedTeammateIds: string[];
  onTogglePlayer: (id: string) => void;
  onToggleTeammate: (id: string) => void;
  /** Hráči, které už nejde odebrat — mají v zápase gól nebo asistenci. */
  lockedPlayerIds?: string[];
  lockedTeammateIds?: string[];
  /** Rozdělit spoluhráče podle týmu (soupisky z více týmů). */
  groupTeammatesByTeam?: boolean;
  playersLabel?: string;
  teammatesLabel?: string;
  noPlayersHint?: string;
}

const ACCENT = {
  red: {
    row: "border-red-600 bg-red-600/10",
    box: "border-red-600 bg-red-600",
  },
  blue: {
    row: "border-blue-600 bg-blue-600/10",
    box: "border-blue-600 bg-blue-600",
  },
} as const;

function CheckRow({
  checked,
  locked,
  accent,
  onToggle,
  name,
  jerseyNumber,
}: {
  checked: boolean;
  locked: boolean;
  accent: keyof typeof ACCENT;
  onToggle: () => void;
  name: string;
  jerseyNumber: number | null;
}) {
  const a = ACCENT[accent];
  return (
    <label
      className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${
        checked ? a.row : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      } ${locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      title={locked ? "Hráč má v zápase gól nebo asistenci — nejde odebrat" : undefined}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={onToggle}
        className="sr-only"
      />
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
          checked ? a.box : "border-zinc-600"
        }`}
      >
        {checked && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium text-white">{name}</span>
      {jerseyNumber !== null && <span className="text-xs text-zinc-400">#{jerseyNumber}</span>}
      {locked && (
        <span className="ml-auto text-xs text-zinc-500" aria-hidden>
          🔒
        </span>
      )}
    </label>
  );
}

// Hledání bez ohledu na diakritiku a velikost písmen ("plasil" najde "Plášil").
function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function matchesQuery(
  person: { first_name: string; last_name: string; jersey_number: number | null },
  q: string
) {
  if (!q) return true;
  const name = normalize(`${person.first_name} ${person.last_name}`);
  const reversed = normalize(`${person.last_name} ${person.first_name}`);
  return name.includes(q) || reversed.includes(q) || String(person.jersey_number ?? "") === q;
}

export function NominationPicker({
  players,
  teammates,
  selectedPlayerIds,
  selectedTeammateIds,
  onTogglePlayer,
  onToggleTeammate,
  lockedPlayerIds = [],
  lockedTeammateIds = [],
  groupTeammatesByTeam = false,
  playersLabel = "Moji hráči",
  teammatesLabel = "Hráči ze soupisky",
  noPlayersHint = "Nejdříve přidej hráče v sekci Hráči",
}: NominationPickerProps) {
  const [search, setSearch] = useState("");
  const q = normalize(search.trim());
  const filteredPlayers = players.filter((p) => matchesQuery(p, q));
  const filteredTeammates = teammates.filter((t) => matchesQuery(t, q));
  const showSearch = players.length + teammates.length > 0;
  const noResults = !!q && filteredPlayers.length === 0 && filteredTeammates.length === 0;

  // Skupiny spoluhráčů podle týmu; bez seskupení jeden bezejmenný blok.
  const groups = groupTeammatesByTeam
    ? Object.entries(
        filteredTeammates.reduce<Record<string, TeammateOption[]>>((acc, tm) => {
          const key = tm.team?.name ?? "Bez týmu";
          (acc[key] ??= []).push(tm);
          return acc;
        }, {})
      )
    : ([["", filteredTeammates]] as [string, TeammateOption[]][]);

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // Enter v hledání nesmí odeslat celý formulář zápasu.
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="Hledat hráče podle jména nebo čísla…"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-10 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              aria-label="Vymazat hledání"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {noResults && <p className="py-2 text-center text-sm text-zinc-500">Žádný hráč neodpovídá „{search.trim()}“</p>}

      {(!q || filteredPlayers.length > 0) && (
        <div>
          <label className="mb-2 block text-sm text-zinc-400">{playersLabel}</label>
          {players.length === 0 ? (
            <p className="text-sm text-zinc-500">{noPlayersHint}</p>
          ) : (
            <div className="space-y-2">
              {filteredPlayers.map((player) => (
                <CheckRow
                  key={player.id}
                  checked={selectedPlayerIds.includes(player.id)}
                  locked={lockedPlayerIds.includes(player.id)}
                  accent="red"
                  onToggle={() => onTogglePlayer(player.id)}
                  name={`${player.first_name} ${player.last_name}`}
                  jerseyNumber={player.jersey_number}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {filteredTeammates.length > 0 && (
        <div>
          <label className="mb-2 block text-sm text-zinc-400">{teammatesLabel}</label>
          <div className="space-y-3">
            {groups.map(([teamName, list]) => (
              <div key={teamName}>
                {teamName && <p className="mb-1 text-xs font-medium text-zinc-500">{teamName}</p>}
                <div className="space-y-2">
                  {list.map((mate) => (
                    <CheckRow
                      key={mate.id}
                      checked={selectedTeammateIds.includes(mate.id)}
                      locked={lockedTeammateIds.includes(mate.id)}
                      accent="blue"
                      onToggle={() => onToggleTeammate(mate.id)}
                      name={`${mate.first_name} ${mate.last_name}`}
                      jerseyNumber={mate.jersey_number}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
