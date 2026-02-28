"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Player, Teammate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface RosterManagerProps {
  teamId: string;
  roster: Teammate[];
  availablePlayers: Player[];
}

export function RosterManager({ teamId, roster, availablePlayers }: RosterManagerProps) {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const playersInRoster = roster.filter((t) => t.player_id);
  const playersNotInRoster = availablePlayers.filter(
    (p) => !playersInRoster.some((t) => t.player_id === p.id)
  );

  async function addMyPlayer(player: Player) {
    setLoading(true);
    await supabase.from("teammates").insert({
      team_id: teamId,
      player_id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      jersey_number: player.jersey_number,
    });
    setLoading(false);
    setShowAddPlayer(false);
    router.refresh();
  }

  async function addManualPlayer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("teammates").insert({
      team_id: teamId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
    });
    setLoading(false);
    setFirstName("");
    setLastName("");
    setJerseyNumber("");
    setShowAddManual(false);
    router.refresh();
  }

  async function removeFromRoster(id: string) {
    if (!confirm("Odebrat hráče ze soupisky?")) return;
    setDeletingId(id);
    await supabase.from("teammates").delete().eq("id", id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Soupiska</h3>
        <div className="flex gap-2">
          {playersNotInRoster.length > 0 && (
            <Button size="sm" variant="secondary" onClick={() => setShowAddPlayer(true)}>
              + Můj hráč
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setShowAddManual(true)}>
            + Spoluhráč
          </Button>
        </div>
      </div>

      {roster.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">Soupiska je prázdná</p>
      ) : (
        <div className="space-y-2">
          {roster.map((mate) => (
            <div
              key={mate.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {mate.first_name} {mate.last_name}
                  </span>
                  {mate.jersey_number !== null && (
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                      #{mate.jersey_number}
                    </span>
                  )}
                  {mate.player_id && (
                    <span className="rounded bg-red-600/20 px-1.5 py-0.5 text-xs text-red-400">
                      Můj hráč
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFromRoster(mate.id)}
                disabled={deletingId === mate.id}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-600/20 hover:text-red-400 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add my player modal */}
      <Modal open={showAddPlayer} onClose={() => setShowAddPlayer(false)} title="Přidat z mých hráčů">
        {playersNotInRoster.length === 0 ? (
          <p className="text-sm text-zinc-400">Všichni hráči jsou již v soupisce</p>
        ) : (
          <div className="space-y-2">
            {playersNotInRoster.map((player) => (
              <button
                key={player.id}
                onClick={() => addMyPlayer(player)}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 p-3 text-left transition-colors hover:border-zinc-600 disabled:opacity-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600/20 text-xs font-bold text-red-400">
                  {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                </div>
                <div>
                  <span className="text-sm font-medium text-white">
                    {player.first_name} {player.last_name}
                  </span>
                  {player.jersey_number !== null && (
                    <span className="ml-2 text-xs text-zinc-400">#{player.jersey_number}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Add manual player modal */}
      <Modal open={showAddManual} onClose={() => setShowAddManual(false)} title="Přidat spoluhráče">
        <form onSubmit={addManualPlayer} className="space-y-4">
          <Input
            id="mateFirstName"
            label="Jméno *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="Pavel"
          />
          <Input
            id="mateLastName"
            label="Příjmení *"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="Dvořák"
          />
          <Input
            id="mateJersey"
            label="Číslo dresu"
            type="number"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            placeholder="12"
            min="0"
            max="99"
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddManual(false)} fullWidth>
              Zrušit
            </Button>
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? "Ukládám..." : "Přidat"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
