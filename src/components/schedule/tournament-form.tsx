"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/ensure-profile";
import type { Tournament, Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ErrorBanner } from "@/components/ui/error-banner";
import type { TeammateWithTeam } from "./schedule-view";

interface TournamentFormProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  teammates: TeammateWithTeam[];
  tournament?: Tournament;
  initialPlayerIds?: string[];
  initialTeammateIds?: string[];
}

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  if (now.getMonth() >= 6) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

export function TournamentForm({
  open,
  onClose,
  players,
  teammates,
  tournament,
  initialPlayerIds = [],
  initialTeammateIds = [],
}: TournamentFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(tournament?.name ?? "");
  const [location, setLocation] = useState(tournament?.location ?? "");
  const [startDate, setStartDate] = useState(tournament?.start_date ?? "");
  const [endDate, setEndDate] = useState(tournament?.end_date ?? "");
  const [season, setSeason] = useState(tournament?.season ?? getCurrentSeason());
  const [notes, setNotes] = useState(tournament?.notes ?? "");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(initialPlayerIds);
  const [selectedTeammateIds, setSelectedTeammateIds] = useState<string[]>(initialTeammateIds);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group teammates by team name for the nomination picker.
  const teammatesByTeam = teammates.reduce<Record<string, TeammateWithTeam[]>>((acc, tm) => {
    const key = tm.team?.name ?? "Bez týmu";
    (acc[key] ??= []).push(tm);
    return acc;
  }, {});

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }
  function toggleTeammate(id: string) {
    setSelectedTeammateIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vyplň název turnaje");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const userId = await ensureProfile(supabase);
      const payload = {
        name: name.trim(),
        location: location.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        season: season.trim() || getCurrentSeason(),
        notes: notes.trim() || null,
      };

      let tournamentId = tournament?.id;
      if (tournament) {
        const { error: updErr } = await supabase.from("tournaments").update(payload).eq("id", tournament.id);
        if (updErr) throw updErr;
        // Replace nomination.
        const { error: delErr } = await supabase.from("tournament_players").delete().eq("tournament_id", tournament.id);
        if (delErr) throw delErr;
      } else {
        const { data, error: insErr } = await supabase
          .from("tournaments")
          .insert({ user_id: userId, ...payload })
          .select("id")
          .single();
        if (insErr) throw insErr;
        tournamentId = data!.id;
      }

      const nominationRows = [
        ...selectedPlayerIds.map((pid) => ({ tournament_id: tournamentId, player_id: pid, is_my_player: true })),
        ...selectedTeammateIds.map((tid) => ({ tournament_id: tournamentId, teammate_id: tid, is_my_player: false })),
      ];
      if (nominationRows.length > 0) {
        const { error: nomErr } = await supabase.from("tournament_players").insert(nominationRows);
        if (nomErr) throw nomErr;
      }

      setLoading(false);
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nepodařilo se uložit turnaj");
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={tournament ? "Upravit turnaj" : "Nový turnaj"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        <Input id="tName" label="Název turnaje *" value={name} onChange={(e) => setName(e.target.value)} placeholder="např. Turnaj Chomutov" autoFocus />
        <Input id="tLocation" label="Místo" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="např. Chomutov" />
        <div className="flex gap-3">
          <Input id="tStart" label="Datum od" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input id="tEnd" label="Datum do" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Input id="tSeason" label="Sezóna" value={season} onChange={(e) => setSeason(e.target.value)} placeholder="2025-2026" />

        {/* Nomination — my players */}
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Nominace — moji hráči</label>
          {players.length === 0 ? (
            <p className="text-sm text-zinc-500">Nejdříve přidej hráče v sekci Hráči</p>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <label
                  key={player.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                    selectedPlayerIds.includes(player.id) ? "border-red-600 bg-red-600/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <input type="checkbox" checked={selectedPlayerIds.includes(player.id)} onChange={() => togglePlayer(player.id)} className="sr-only" />
                  <div className={`flex h-5 w-5 items-center justify-center rounded border-2 ${selectedPlayerIds.includes(player.id) ? "border-red-600 bg-red-600" : "border-zinc-600"}`}>
                    {selectedPlayerIds.includes(player.id) && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">{player.first_name} {player.last_name}</span>
                  {player.jersey_number !== null && <span className="text-xs text-zinc-400">#{player.jersey_number}</span>}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Nomination — teammates grouped by team */}
        {Object.keys(teammatesByTeam).length > 0 && (
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Nominace — spoluhráči (ze soupisek)</label>
            <div className="space-y-3">
              {Object.entries(teammatesByTeam).map(([teamName, list]) => (
                <div key={teamName}>
                  <p className="mb-1 text-xs font-medium text-zinc-500">{teamName}</p>
                  <div className="space-y-2">
                    {list.map((mate) => (
                      <label
                        key={mate.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                          selectedTeammateIds.includes(mate.id) ? "border-blue-600 bg-blue-600/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        }`}
                      >
                        <input type="checkbox" checked={selectedTeammateIds.includes(mate.id)} onChange={() => toggleTeammate(mate.id)} className="sr-only" />
                        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 ${selectedTeammateIds.includes(mate.id) ? "border-blue-600 bg-blue-600" : "border-zinc-600"}`}>
                          {selectedTeammateIds.includes(mate.id) && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-white">{mate.first_name} {mate.last_name}</span>
                        {mate.jersey_number !== null && <span className="text-xs text-zinc-400">#{mate.jersey_number}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Input id="tNotes" label="Poznámka" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="volitelné" />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Zrušit</Button>
          <Button type="submit" fullWidth disabled={loading}>{loading ? "Ukládám…" : tournament ? "Uložit" : "Vytvořit turnaj"}</Button>
        </div>
      </form>
    </Modal>
  );
}
