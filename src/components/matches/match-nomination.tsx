"use client";

import { useState } from "react";
import type { Goal, Match, Player } from "@/lib/types";
import { MatchNominationModal, type MatchPlayerRow } from "./match-nomination-modal";
import type { TeammateOption } from "./nomination-picker";

interface MatchNominationProps {
  match: Match;
  matchPlayers: MatchPlayerRow[];
  goals: Goal[];
  players: Player[];
  teammates: TeammateOption[];
}

function displayName(mp: MatchPlayerRow): string {
  const src = mp.player ?? mp.teammate;
  if (!src) return "—";
  const num = src.jersey_number !== null ? ` #${src.jersey_number}` : "";
  return `${src.first_name} ${src.last_name}${num}`;
}

export function MatchNomination({ match, matchPlayers, goals, players, teammates }: MatchNominationProps) {
  const [editOpen, setEditOpen] = useState(false);

  // Vlastní hráči první, pak soupiska — stejné pořadí jako při výběru střelce.
  const sorted = [...matchPlayers].sort(
    (a, b) => Number(b.is_my_player) - Number(a.is_my_player)
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Nominace {matchPlayers.length > 0 && <span className="text-zinc-600">({matchPlayers.length})</span>}
        </h3>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/20"
        >
          {matchPlayers.length === 0 ? "+ Nominovat hráče" : "Upravit nominaci"}
        </button>
      </div>

      {matchPlayers.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Zatím nikdo nenominován — bez nominace nejde u gólu vybrat střelce.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sorted.map((mp) => (
            <span
              key={mp.id}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                mp.is_my_player ? "bg-red-600/20 text-red-300" : "bg-blue-600/20 text-blue-300"
              }`}
            >
              {mp.is_my_player && "★ "}
              {displayName(mp)}
            </span>
          ))}
        </div>
      )}

      {editOpen && (
        <MatchNominationModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          match={match}
          matchPlayers={matchPlayers}
          goals={goals}
          players={players}
          teammates={teammates}
        />
      )}
    </div>
  );
}
