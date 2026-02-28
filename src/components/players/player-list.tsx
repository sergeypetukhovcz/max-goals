"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PlayerForm } from "./player-form";

interface PlayerListProps {
  players: Player[];
}

function getAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function PlayerList({ players }: PlayerListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tohoto hráče?")) return;
    setDeletingId(id);
    await supabase.from("players").delete().eq("id", id);
    setDeletingId(null);
    router.refresh();
  }

  function openEdit(player: Player) {
    setEditPlayer(player);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditPlayer(undefined);
  }

  if (players.length === 0) {
    return (
      <>
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="Zatím žádní hráči"
          description="Přidej prvního hráče"
          action={
            <Button onClick={() => setShowForm(true)}>+ Přidat hráče</Button>
          }
        />
        <PlayerForm open={showForm} onClose={closeForm} />
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Hráči</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>+ Přidat</Button>
      </div>

      <div className="space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
          >
            {player.photo_url ? (
              <img
                src={player.photo_url}
                alt={`${player.first_name} ${player.last_name}`}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 text-sm font-bold text-red-400">
                {getInitials(player.first_name, player.last_name)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white truncate">
                  {player.first_name} {player.last_name}
                </span>
                {player.jersey_number !== null && (
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                    #{player.jersey_number}
                  </span>
                )}
              </div>
              {player.date_of_birth && (
                <p className="text-xs text-zinc-400">
                  {getAge(player.date_of_birth)} let
                </p>
              )}
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => openEdit(player)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(player.id)}
                disabled={deletingId === player.id}
                className="rounded-lg p-2 text-zinc-400 hover:bg-red-600/20 hover:text-red-400 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <PlayerForm player={editPlayer} open={showForm} onClose={closeForm} />
    </>
  );
}
