"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Player } from "@/lib/types";
import { ensureProfile } from "@/lib/ensure-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface PlayerFormProps {
  player?: Player;
  open: boolean;
  onClose: () => void;
}

export function PlayerForm({ player, open, onClose }: PlayerFormProps) {
  const isEdit = !!player;
  const router = useRouter();
  const supabase = createClient();

  const [firstName, setFirstName] = useState(player?.first_name ?? "");
  const [lastName, setLastName] = useState(player?.last_name ?? "");
  const [jerseyNumber, setJerseyNumber] = useState(player?.jersey_number?.toString() ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(player?.date_of_birth ?? "");
  const [photoUrl, setPhotoUrl] = useState(player?.photo_url ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
      date_of_birth: dateOfBirth || null,
      photo_url: photoUrl.trim() || null,
    };

    if (isEdit) {
      const { error } = await supabase.from("players").update(data).eq("id", player.id);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      try {
        const userId = await ensureProfile(supabase);
        const { error } = await supabase.from("players").insert({ ...data, user_id: userId });
        if (error) { setError(error.message); setLoading(false); return; }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Chyba");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Upravit hráče" : "Nový hráč"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        )}
        <Input
          id="firstName"
          label="Jméno *"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          placeholder="Jan"
        />
        <Input
          id="lastName"
          label="Příjmení *"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          placeholder="Novák"
        />
        <Input
          id="jerseyNumber"
          label="Číslo dresu"
          type="number"
          value={jerseyNumber}
          onChange={(e) => setJerseyNumber(e.target.value)}
          placeholder="7"
          min="0"
          max="99"
        />
        <Input
          id="dateOfBirth"
          label="Datum narození"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
        <Input
          id="photoUrl"
          label="URL fotky"
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://..."
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Zrušit
          </Button>
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? "Ukládám..." : isEdit ? "Uložit" : "Přidat"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
