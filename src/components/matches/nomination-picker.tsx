"use client";

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
  // Skupiny spoluhráčů podle týmu; bez seskupení jeden bezejmenný blok.
  const groups = groupTeammatesByTeam
    ? Object.entries(
        teammates.reduce<Record<string, TeammateOption[]>>((acc, tm) => {
          const key = tm.team?.name ?? "Bez týmu";
          (acc[key] ??= []).push(tm);
          return acc;
        }, {})
      )
    : ([["", teammates]] as [string, TeammateOption[]][]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm text-zinc-400">{playersLabel}</label>
        {players.length === 0 ? (
          <p className="text-sm text-zinc-500">{noPlayersHint}</p>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
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

      {teammates.length > 0 && (
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
