"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Team, Player, Teammate } from "@/lib/types";
import { ensureProfile } from "@/lib/ensure-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

interface NewMatchFormProps {
  teams: Team[];
  players: Player[];
  teammates: Teammate[];
}

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // If July or later, season is YYYY-(YYYY+1). If before July, (YYYY-1)-YYYY.
  if (month >= 6) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

export function NewMatchForm({ teams, players, teammates }: NewMatchFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // Team selection
  const [homeTeamId, setHomeTeamId] = useState<string | null>(null);
  const [homeTeamName, setHomeTeamName] = useState("");
  const [homeSearch, setHomeSearch] = useState("");
  const [showHomeSuggestions, setShowHomeSuggestions] = useState(false);

  const [awayTeamId, setAwayTeamId] = useState<string | null>(null);
  const [awayTeamName, setAwayTeamName] = useState("");
  const [awaySearch, setAwaySearch] = useState("");
  const [showAwaySuggestions, setShowAwaySuggestions] = useState(false);

  // Match settings
  const [periodsCount, setPeriodsCount] = useState(3);
  const [useTimer, setUseTimer] = useState(false);
  const [periodDuration, setPeriodDuration] = useState("15");
  const [season, setSeason] = useState(getCurrentSeason());
  const [notes, setNotes] = useState("");

  // Players
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [selectedTeammateIds, setSelectedTeammateIds] = useState<string[]>([]);
  const [myPlayersIsHome, setMyPlayersIsHome] = useState<boolean>(true);

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

  // Get roster of selected home team
  const homeRoster = useMemo(
    () => (homeTeamId ? teammates.filter((t) => t.team_id === homeTeamId) : []),
    [homeTeamId, teammates]
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

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function toggleTeammate(id: string) {
    setSelectedTeammateIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!homeTeamName.trim() || !awayTeamName.trim()) {
      setError("Vyplň názvy obou týmů");
      return;
    }
    if (selectedPlayerIds.length === 0) {
      setError("Vyber alespoň jednoho svého hráče");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const userId = await ensureProfile(supabase);

      // Quick-create home team if needed
      let finalHomeTeamId = homeTeamId;
      if (!finalHomeTeamId && homeTeamName.trim()) {
        const { data: newTeam } = await supabase
          .from("teams")
          .insert({ user_id: userId, name: homeTeamName.trim() })
          .select("id")
          .single();
        if (newTeam) finalHomeTeamId = newTeam.id;
      }

      // Quick-create away team if needed
      let finalAwayTeamId = awayTeamId;
      if (!finalAwayTeamId && awayTeamName.trim()) {
        const { data: newTeam } = await supabase
          .from("teams")
          .insert({ user_id: userId, name: awayTeamName.trim() })
          .select("id")
          .single();
        if (newTeam) finalAwayTeamId = newTeam.id;
      }

      // Create match
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({
          user_id: userId,
          home_team_id: finalHomeTeamId,
          away_team_id: finalAwayTeamId,
          home_team_name: homeTeamName.trim(),
          away_team_name: awayTeamName.trim(),
          periods_count: periodsCount,
          period_duration_minutes: useTimer ? parseInt(periodDuration) : null,
          season,
          notes: notes.trim() || null,
          status: "not_started",
          current_period: 1,
        })
        .select("id")
        .single();

      if (matchError) throw matchError;
      if (!match) throw new Error("Nepodařilo se vytvořit zápas");

      // Add match players (my players)
      const playerInserts = selectedPlayerIds.map((playerId) => ({
        match_id: match.id,
        player_id: playerId,
        is_my_player: true,
        is_home: myPlayersIsHome,
      }));

      // Add match players (teammates)
      const teammateInserts = selectedTeammateIds.map((teammateId) => ({
        match_id: match.id,
        teammate_id: teammateId,
        is_my_player: false,
      }));

      if (playerInserts.length + teammateInserts.length > 0) {
        await supabase.from("match_players").insert([...playerInserts, ...teammateInserts]);
      }

      router.push(`/matches/${match.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nastala chyba");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

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

      {/* Periods */}
      <div>
        <label className="mb-2 block text-sm text-zinc-400">Počet třetin</label>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPeriodsCount(n)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                periodsCount === n
                  ? "bg-red-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Timer toggle */}
      <div className="space-y-3">
        <Toggle
          label="Čas třetin"
          enabled={useTimer}
          onChange={setUseTimer}
          description="Zapni pro zápasy s časomírou"
        />
        {useTimer && (
          <Input
            id="periodDuration"
            label="Délka třetiny (minuty)"
            type="number"
            value={periodDuration}
            onChange={(e) => setPeriodDuration(e.target.value)}
            min="1"
            max="60"
          />
        )}
      </div>

      {/* Season */}
      <Input
        id="season"
        label="Sezóna"
        value={season}
        onChange={(e) => setSeason(e.target.value)}
        placeholder="2025-2026"
      />

      {/* My players */}
      <div>
        <label className="mb-2 block text-sm text-zinc-400">Moji hráči v zápase *</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setMyPlayersIsHome(true)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              myPlayersIsHome
                ? "bg-red-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Hrají za domácí
          </button>
          <button
            type="button"
            onClick={() => setMyPlayersIsHome(false)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              !myPlayersIsHome
                ? "bg-red-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Hrají za hosty
          </button>
        </div>
        {players.length === 0 ? (
          <p className="text-sm text-zinc-500">Nejdříve přidej hráče v sekci Hráči</p>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <label
                key={player.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  selectedPlayerIds.includes(player.id)
                    ? "border-red-600 bg-red-600/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedPlayerIds.includes(player.id)}
                  onChange={() => togglePlayer(player.id)}
                  className="sr-only"
                />
                <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                  selectedPlayerIds.includes(player.id) ? "border-red-600 bg-red-600" : "border-zinc-600"
                }`}>
                  {selectedPlayerIds.includes(player.id) && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-white">
                  {player.first_name} {player.last_name}
                </span>
                {player.jersey_number !== null && (
                  <span className="text-xs text-zinc-400">#{player.jersey_number}</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Team roster players (if a home team with roster is selected) */}
      {homeRoster.length > 0 && (
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Hráči ze soupisky</label>
          <div className="space-y-2">
            {homeRoster
              .filter((t) => !selectedPlayerIds.includes(t.player_id ?? ""))
              .map((mate) => (
                <label
                  key={mate.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    selectedTeammateIds.includes(mate.id)
                      ? "border-blue-600 bg-blue-600/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTeammateIds.includes(mate.id)}
                    onChange={() => toggleTeammate(mate.id)}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                    selectedTeammateIds.includes(mate.id) ? "border-blue-600 bg-blue-600" : "border-zinc-600"
                  }`}>
                    {selectedTeammateIds.includes(mate.id) && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-white">
                    {mate.first_name} {mate.last_name}
                  </span>
                  {mate.jersey_number !== null && (
                    <span className="text-xs text-zinc-400">#{mate.jersey_number}</span>
                  )}
                </label>
              ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <Input
        id="notes"
        label="Poznámka"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="např. přátelský zápas, turnaj..."
      />

      {/* Submit */}
      <Button type="submit" disabled={loading} fullWidth size="lg">
        {loading ? "Vytvářím zápas..." : "Zahájit zápas"}
      </Button>
    </form>
  );
}
