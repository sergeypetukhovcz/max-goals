"use client";

import { useState } from "react";
import type { Goal, MatchPlayer, Player, Teammate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export interface GoalFormData {
  is_home_goal: boolean;
  scorer_player_id: string | null;
  scorer_teammate_id: string | null;
  scorer_name: string | null;
  assist_player_id: string | null;
  assist_teammate_id: string | null;
  assist_name: string | null;
  note: string | null;
}

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  isHome: boolean;
  goal: Goal | null;
  matchPlayers: (MatchPlayer & { player?: Player; teammate?: Teammate })[];
  onSave: (data: GoalFormData) => void;
  onDelete?: () => void;
}

type Tab = "goal" | "assist";

export function GoalModal({ open, onClose, isHome, goal, matchPlayers, onSave, onDelete }: GoalModalProps) {
  // Parents remount this modal via `key` when the edited goal or open state
  // changes, so initialising from props here is enough — no syncing effect.
  const [tab, setTab] = useState<Tab>("goal");
  const [scorerPlayerId, setScorerPlayerId] = useState<string | null>(goal?.scorer_player_id ?? null);
  const [scorerTeammateId, setScorerTeammateId] = useState<string | null>(goal?.scorer_teammate_id ?? null);
  const [assistPlayerId, setAssistPlayerId] = useState<string | null>(goal?.assist_player_id ?? null);
  const [assistTeammateId, setAssistTeammateId] = useState<string | null>(goal?.assist_teammate_id ?? null);
  const [note, setNote] = useState(goal?.note ?? "");

  const myPlayers = matchPlayers.filter((mp) => mp.is_my_player && mp.player);
  const teammatePlayers = matchPlayers.filter((mp) => !mp.is_my_player && mp.teammate);

  function nameFor(playerId: string | null, teammateId: string | null): string | null {
    if (playerId) {
      const mp = matchPlayers.find((m) => m.player_id === playerId);
      return mp?.player ? `${mp.player.first_name} ${mp.player.last_name}` : null;
    }
    if (teammateId) {
      const mp = matchPlayers.find((m) => m.teammate_id === teammateId);
      return mp?.teammate ? `${mp.teammate.first_name} ${mp.teammate.last_name}` : null;
    }
    return null;
  }

  function handleSave() {
    onSave({
      is_home_goal: isHome,
      scorer_player_id: scorerPlayerId,
      scorer_teammate_id: scorerTeammateId,
      scorer_name: nameFor(scorerPlayerId, scorerTeammateId),
      assist_player_id: assistPlayerId,
      assist_teammate_id: assistTeammateId,
      assist_name: nameFor(assistPlayerId, assistTeammateId),
      note: note.trim() || null,
    });
  }

  // Current selection + setter for the active tab.
  const selPlayerId = tab === "goal" ? scorerPlayerId : assistPlayerId;
  const selTeammateId = tab === "goal" ? scorerTeammateId : assistTeammateId;
  const selectScorer = (playerId: string | null, teammateId: string | null) => {
    if (tab === "goal") {
      setScorerPlayerId(playerId);
      setScorerTeammateId(teammateId);
    } else {
      setAssistPlayerId(playerId);
      setAssistTeammateId(teammateId);
    }
  };
  const noneLabel = tab === "goal" ? "Neznámý střelec" : "Bez asistence";

  const scorerLabel = nameFor(scorerPlayerId, scorerTeammateId);
  const assistLabel = nameFor(assistPlayerId, assistTeammateId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? "Upravit gól" : `Gól — ${isHome ? "Domácí" : "Hosté"}`}
    >
      <div className="space-y-4">
        {/* Tab switch: goal / assist */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("goal")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === "goal" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Gól
            {scorerLabel && <span className="block text-xs font-normal opacity-80 truncate">{scorerLabel}</span>}
          </button>
          <button
            type="button"
            onClick={() => setTab("assist")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === "assist" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Asistence
            {assistLabel && <span className="block text-xs font-normal opacity-80 truncate">{assistLabel}</span>}
          </button>
        </div>

        {/* Scorer / assist selection (same mechanic for both tabs) */}
        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            {tab === "goal" ? "Kdo dal gól?" : "Kdo přihrál?"}
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* No scorer / no assist option */}
            <button
              type="button"
              onClick={() => selectScorer(null, null)}
              className={`w-full rounded-lg border p-2.5 text-left text-sm transition-colors ${
                !selPlayerId && !selTeammateId
                  ? "border-red-600 bg-red-600/10 text-white"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {noneLabel}
            </button>

            {/* My players */}
            {myPlayers.map((mp) => (
              <button
                key={mp.id}
                type="button"
                onClick={() => selectScorer(mp.player_id, null)}
                className={`w-full rounded-lg border p-2.5 text-left text-sm transition-colors ${
                  selPlayerId === mp.player_id
                    ? "border-red-600 bg-red-600/10 text-white"
                    : "border-zinc-800 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-red-600/20 px-1 py-0.5 text-xs text-red-400">★</span>
                  <span>{mp.player?.first_name} {mp.player?.last_name}</span>
                  {mp.player?.jersey_number !== null && mp.player?.jersey_number !== undefined && (
                    <span className="text-xs text-zinc-500">#{mp.player.jersey_number}</span>
                  )}
                </div>
              </button>
            ))}

            {/* Teammates */}
            {teammatePlayers.map((mp) => (
              <button
                key={mp.id}
                type="button"
                onClick={() => selectScorer(null, mp.teammate_id)}
                className={`w-full rounded-lg border p-2.5 text-left text-sm transition-colors ${
                  selTeammateId === mp.teammate_id
                    ? "border-blue-600 bg-blue-600/10 text-white"
                    : "border-zinc-800 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <span>{mp.teammate?.first_name} {mp.teammate?.last_name}</span>
                {mp.teammate?.jersey_number !== null && mp.teammate?.jersey_number !== undefined && (
                  <span className="text-xs text-zinc-500 ml-2">#{mp.teammate.jersey_number}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Poznámka ke gólu</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
            placeholder="např. nájezd, přesilovka..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {goal && onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Smazat
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={onClose}>
            Zrušit
          </Button>
          <Button fullWidth onClick={handleSave}>
            {goal ? "Uložit" : "Přidat gól"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
