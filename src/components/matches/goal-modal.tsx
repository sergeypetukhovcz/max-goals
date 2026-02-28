"use client";

import { useState, useEffect } from "react";
import type { Goal, MatchPlayer, Player, Teammate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  isHome: boolean;
  goal: Goal | null;
  matchPlayers: (MatchPlayer & { player?: Player; teammate?: Teammate })[];
  onSave: (data: {
    is_home_goal: boolean;
    scorer_player_id: string | null;
    scorer_teammate_id: string | null;
    scorer_name: string | null;
    note: string | null;
  }) => void;
  onDelete?: () => void;
}

export function GoalModal({ open, onClose, isHome, goal, matchPlayers, onSave, onDelete }: GoalModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedTeammateId, setSelectedTeammateId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (goal) {
      setSelectedPlayerId(goal.scorer_player_id);
      setSelectedTeammateId(goal.scorer_teammate_id);
      setNote(goal.note ?? "");
    } else {
      setSelectedPlayerId(null);
      setSelectedTeammateId(null);
      setNote("");
    }
  }, [goal, open]);

  const myPlayers = matchPlayers.filter((mp) => mp.is_my_player && mp.player);
  const teammatePlayers = matchPlayers.filter((mp) => !mp.is_my_player && mp.teammate);

  function selectScorer(playerId: string | null, teammateId: string | null) {
    setSelectedPlayerId(playerId);
    setSelectedTeammateId(teammateId);
  }

  function handleSave() {
    let scorerName: string | null = null;
    if (selectedPlayerId) {
      const mp = matchPlayers.find((m) => m.player_id === selectedPlayerId);
      if (mp?.player) scorerName = `${mp.player.first_name} ${mp.player.last_name}`;
    } else if (selectedTeammateId) {
      const mp = matchPlayers.find((m) => m.teammate_id === selectedTeammateId);
      if (mp?.teammate) scorerName = `${mp.teammate.first_name} ${mp.teammate.last_name}`;
    }

    onSave({
      is_home_goal: isHome,
      scorer_player_id: selectedPlayerId,
      scorer_teammate_id: selectedTeammateId,
      scorer_name: scorerName,
      note: note.trim() || null,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? "Upravit gól" : `Gól — ${isHome ? "Domácí" : "Hosté"}`}
    >
      <div className="space-y-4">
        {/* Scorer selection */}
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Kdo dal gól?</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* No scorer option */}
            <button
              type="button"
              onClick={() => selectScorer(null, null)}
              className={`w-full rounded-lg border p-2.5 text-left text-sm transition-colors ${
                !selectedPlayerId && !selectedTeammateId
                  ? "border-red-600 bg-red-600/10 text-white"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              Neznámý střelec
            </button>

            {/* My players */}
            {myPlayers.map((mp) => (
              <button
                key={mp.id}
                type="button"
                onClick={() => selectScorer(mp.player_id, null)}
                className={`w-full rounded-lg border p-2.5 text-left text-sm transition-colors ${
                  selectedPlayerId === mp.player_id
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
                  selectedTeammateId === mp.teammate_id
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
