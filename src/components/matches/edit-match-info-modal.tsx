"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Match, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface EditMatchInfoModalProps {
  open: boolean;
  onClose: () => void;
  match: Match;
  teams: Team[];
  onSave: (updated: Match) => void;
}

function toLocalDatetime(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditMatchInfoModal({ open, onClose, match, teams, onSave }: EditMatchInfoModalProps) {
  const supabase = createClient();

  // Date & basic info
  const [matchDate, setMatchDate] = useState(toLocalDatetime(match.created_at));
  const [season, setSeason] = useState(match.season);
  const [notes, setNotes] = useState(match.notes ?? "");

  // Home team combobox
  const [homeTeamId, setHomeTeamId] = useState<string | null>(match.home_team_id);
  const [homeTeamName, setHomeTeamName] = useState(match.home_team_name);
  const [homeSearch, setHomeSearch] = useState(match.home_team_name);
  const [showHomeSuggestions, setShowHomeSuggestions] = useState(false);

  // Away team combobox
  const [awayTeamId, setAwayTeamId] = useState<string | null>(match.away_team_id);
  const [awayTeamName, setAwayTeamName] = useState(match.away_team_name);
  const [awaySearch, setAwaySearch] = useState(match.away_team_name);
  const [showAwaySuggestions, setShowAwaySuggestions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter teams for suggestions
  const homeFiltered = useMemo(
    () => teams.filter((t) => t.name.toLowerCase().includes(homeSearch.toLowerCase())),
    [teams, homeSearch]
  );
  const awayFiltered = useMemo(
    () => teams.filter((t) => t.name.toLowerCase().includes(awaySearch.toLowerCase())),
    [teams, awaySearch]
  );

  function selectHomeTeam(team: Team) {
    setHomeTeamId(team.id);
    setHomeTeamName(team.name);
    setHomeSearch(team.name);
    setShowHomeSuggestions(false);
  }

  function selectAwayTeam(team: Team) {
    setAwayTeamId(team.id);
    setAwayTeamName(team.name);
    setAwaySearch(team.name);
    setShowAwaySuggestions(false);
  }

  function handleHomeSearchChange(value: string) {
    setHomeSearch(value);
    setHomeTeamName(value);
    setHomeTeamId(null);
    setShowHomeSuggestions(true);
  }

  function handleAwaySearchChange(value: string) {
    setAwaySearch(value);
    setAwayTeamName(value);
    setAwayTeamId(null);
    setShowAwaySuggestions(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!homeTeamName.trim() || !awayTeamName.trim()) {
      setError("Vyplň názvy obou týmů");
      return;
    }
    if (!season.trim()) {
      setError("Vyplň sezónu");
      return;
    }

    setError(null);
    setLoading(true);

    const updateData = {
      created_at: new Date(matchDate).toISOString(),
      season: season.trim(),
      notes: notes.trim() || null,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_team_name: homeTeamName.trim(),
      away_team_name: awayTeamName.trim(),
    };

    const { data: updated, error: updateError } = await supabase
      .from("matches")
      .update(updateData)
      .eq("id", match.id)
      .select()
      .single();

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (updated) {
      onSave(updated);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Upravit zápas">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        )}

        {/* Date */}
        <Input
          id="matchDate"
          label="Datum a čas zápasu"
          type="datetime-local"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
        />

        {/* Home team */}
        <div className="relative">
          <Input
            id="homeTeam"
            label="Domácí tým *"
            value={homeSearch}
            onChange={(e) => handleHomeSearchChange(e.target.value)}
            onFocus={() => setShowHomeSuggestions(true)}
            onBlur={() => setTimeout(() => setShowHomeSuggestions(false), 200)}
            placeholder="Název týmu..."
            autoComplete="off"
          />
          {homeTeamId && (
            <span className="absolute right-3 top-8 text-xs text-green-400">✓ vybrán</span>
          )}
          {showHomeSuggestions && homeSearch && homeFiltered.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-lg max-h-40 overflow-y-auto">
              {homeFiltered.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onMouseDown={() => selectHomeTeam(team)}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-700"
                >
                  {team.name}
                  {team.city && <span className="text-zinc-400 ml-1">({team.city})</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="relative">
          <Input
            id="awayTeam"
            label="Hostující tým *"
            value={awaySearch}
            onChange={(e) => handleAwaySearchChange(e.target.value)}
            onFocus={() => setShowAwaySuggestions(true)}
            onBlur={() => setTimeout(() => setShowAwaySuggestions(false), 200)}
            placeholder="Název týmu..."
            autoComplete="off"
          />
          {awayTeamId && (
            <span className="absolute right-3 top-8 text-xs text-green-400">✓ vybrán</span>
          )}
          {showAwaySuggestions && awaySearch && awayFiltered.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-lg max-h-40 overflow-y-auto">
              {awayFiltered.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onMouseDown={() => selectAwayTeam(team)}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-700"
                >
                  {team.name}
                  {team.city && <span className="text-zinc-400 ml-1">({team.city})</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Season */}
        <Input
          id="season"
          label="Sezóna *"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          placeholder="2025-2026"
        />

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-zinc-300">
            Poznámky
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none min-h-[80px]"
            placeholder="např. přátelský zápas, turnaj..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Zrušit
          </Button>
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? "Ukládám..." : "Uložit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
