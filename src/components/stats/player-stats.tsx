"use client";

import { useState } from "react";
import { MatchHistory } from "./match-history";

interface MatchData {
  id: string;
  home_team_name: string;
  away_team_name: string;
  home_team_id: string | null;
  away_team_id: string | null;
  created_at: string;
  status: string;
  season: string;
}

interface GoalData {
  match_id: string;
  is_home_goal: boolean;
  scorer_player_id: string | null;
}

interface Team {
  id: string;
  name: string;
}

interface PlayerStatsProps {
  matches: MatchData[];
  allGoals: GoalData[];
  playerId: string;
  teams: Team[];
  playerSideMap: Record<string, boolean | null>;
}

export function PlayerStats({ matches, allGoals, playerId, teams, playerSideMap }: PlayerStatsProps) {
  const seasons = [...new Set(matches.map((m) => m.season).filter(Boolean))].sort().reverse();
  const [selectedSeason, setSelectedSeason] = useState<string | null>(
    seasons.length > 0 ? seasons[0] : null
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const filteredMatches = matches.filter((m) => {
    if (selectedSeason && m.season !== selectedSeason) return false;
    if (selectedTeamId) {
      const teamMatches =
        m.home_team_id === selectedTeamId || m.away_team_id === selectedTeamId;
      if (!teamMatches) return false;
    }
    return true;
  });

  const filteredMatchIds = new Set(filteredMatches.map((m) => m.id));
  const filteredGoals = allGoals.filter((g) => filteredMatchIds.has(g.match_id));

  const totalGoals = filteredGoals.filter((g) => g.scorer_player_id === playerId).length;
  const totalMatches = filteredMatches.length;
  const avgGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : "0";

  // Derive player's team names from matches where they scored
  const playerTeamNames = new Set<string>();
  for (const m of filteredMatches) {
    const playerGoals = filteredGoals.filter(
      (g) => g.match_id === m.id && g.scorer_player_id === playerId
    );
    if (playerGoals.length > 0) {
      const playerIsHome = playerGoals[0].is_home_goal;
      playerTeamNames.add(playerIsHome ? m.home_team_name : m.away_team_name);
    }
  }

  // Win/draw/loss counts
  let wins = 0, draws = 0, losses = 0;
  for (const m of filteredMatches) {
    const matchGoals = filteredGoals.filter((g) => g.match_id === m.id);
    const playerGoals = matchGoals.filter((g) => g.scorer_player_id === playerId);

    let playerIsHome: boolean | null =
      playerSideMap[m.id] !== undefined ? playerSideMap[m.id] : null;
    if (playerIsHome === null) {
      if (playerGoals.length > 0) {
        playerIsHome = playerGoals[0].is_home_goal;
      } else if (playerTeamNames.has(m.home_team_name)) {
        playerIsHome = true;
      } else if (playerTeamNames.has(m.away_team_name)) {
        playerIsHome = false;
      }
    }

    if (playerIsHome === null) continue;

    const homeScore = matchGoals.filter((g) => g.is_home_goal).length;
    const awayScore = matchGoals.filter((g) => !g.is_home_goal).length;
    const playerScore = playerIsHome ? homeScore : awayScore;
    const opponentScore = playerIsHome ? awayScore : homeScore;
    if (playerScore > opponentScore) wins++;
    else if (playerScore < opponentScore) losses++;
    else draws++;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-2">
        {/* Season filter */}
        {seasons.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedSeason(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedSeason === null
                  ? "bg-red-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Vše
            </button>
            {seasons.map((season) => (
              <button
                key={season}
                onClick={() => setSelectedSeason(season)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedSeason === season
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        )}

        {/* Team filter */}
        {teams.length > 0 && (
          <div className="relative">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 pr-10 text-sm text-white focus:border-red-500 focus:outline-none"
              style={{ appearance: "none", WebkitAppearance: "none", height: "42px" }}
            >
              <option value="">Všechny týmy</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-white">{totalMatches}</p>
            <p className="text-xs text-zinc-400">Zápasů</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{totalGoals}</p>
            <p className="text-xs text-zinc-400">Gólů</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-white">{avgGoals}</p>
            <p className="text-xs text-zinc-400">Gólů/zápas</p>
          </div>
        </div>

      {/* Win/draw/loss row */}
      {(wins + draws + losses) > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 p-3 text-center">
            <p className="text-xl font-bold text-green-400">{wins}</p>
            <p className="text-xs text-green-400">Výher</p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-3 text-center">
            <p className="text-xl font-bold" style={{ color: "#fb923c" }}>{draws}</p>
            <p className="text-xs" style={{ color: "#fb923c" }}>Remíz</p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-3 text-center">
            <p className="text-xl font-bold text-red-400">{losses}</p>
            <p className="text-xs text-red-400">Proher</p>
          </div>
        </div>
      )}
      </div>

      {/* Match history */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Historie zápasů
          {selectedSeason && (
            <span className="ml-2 normal-case font-normal text-zinc-500">— {selectedSeason}</span>
          )}
        </h3>
        <MatchHistory matches={filteredMatches} allGoals={filteredGoals} playerId={playerId} playerSideMap={playerSideMap} />
      </div>
    </div>
  );
}
