"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Team } from "@/lib/types";
import { ensureProfile } from "@/lib/ensure-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ColorPicker } from "@/components/ui/color-picker";

interface TeamFormProps {
  team?: Team;
  open: boolean;
  onClose: () => void;
}

export function TeamForm({ team, open, onClose }: TeamFormProps) {
  const isEdit = !!team;
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(team?.name ?? "");
  const [city, setCity] = useState(team?.city ?? "");
  const [birthYear, setBirthYear] = useState(team?.birth_year ?? "");
  const [colorPrimary, setColorPrimary] = useState(team?.color_primary ?? "#cc0000");
  const [colorSecondary, setColorSecondary] = useState(team?.color_secondary ?? "#ffffff");
  const [defaultColor, setDefaultColor] = useState<"primary" | "secondary">(team?.default_color ?? "primary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = {
      name: name.trim(),
      city: city.trim() || null,
      birth_year: birthYear.trim() || null,
      color_primary: colorPrimary,
      color_secondary: colorSecondary,
      default_color: defaultColor,
    };

    if (isEdit) {
      const { error } = await supabase.from("teams").update(data).eq("id", team.id);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      try {
        const userId = await ensureProfile(supabase);
        const { error } = await supabase.from("teams").insert({ ...data, user_id: userId });
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Upravit tým" : "Nový tým"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        )}
        <Input
          id="teamName"
          label="Název týmu *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="HC Teplice Huskies"
        />
        <Input
          id="teamCity"
          label="Město"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Teplice"
        />
        <Input
          id="birthYear"
          label="Ročník"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder="2018"
        />

        <ColorPicker label="Barva 1" value={colorPrimary} onChange={setColorPrimary} />
        <ColorPicker label="Barva 2" value={colorSecondary} onChange={setColorSecondary} />

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Výchozí barva</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDefaultColor("primary")}
              className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                defaultColor === "primary"
                  ? "border-white text-white"
                  : "border-zinc-700 text-zinc-400"
              }`}
            >
              <span className="inline-block h-3 w-3 rounded-full mr-1" style={{ backgroundColor: colorPrimary }} />
              Barva 1
            </button>
            <button
              type="button"
              onClick={() => setDefaultColor("secondary")}
              className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                defaultColor === "secondary"
                  ? "border-white text-white"
                  : "border-zinc-700 text-zinc-400"
              }`}
            >
              <span className="inline-block h-3 w-3 rounded-full mr-1" style={{ backgroundColor: colorSecondary }} />
              Barva 2
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Zrušit
          </Button>
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? "Ukládám..." : isEdit ? "Uložit" : "Vytvořit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
