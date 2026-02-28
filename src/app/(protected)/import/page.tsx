"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/ensure-profile";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ImportMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  maxGoals: number;
  tepliceIsHome: boolean;
  notes?: string;
  periods?: number;
}

const MATCHES: ImportMatch[] = [
  // 6.8.2025
  { date: "2025-08-06", homeTeam: "Teplice", awayTeam: "Litoměřice", homeScore: 7, awayScore: 5, maxGoals: 0, tepliceIsHome: true },
  { date: "2025-08-06", homeTeam: "Teplice", awayTeam: "Chomutov", homeScore: 6, awayScore: 10, maxGoals: 2, tepliceIsHome: true },
  { date: "2025-08-06", homeTeam: "Teplice", awayTeam: "Karlovy Vary", homeScore: 5, awayScore: 18, maxGoals: 2, tepliceIsHome: true },
  { date: "2025-08-06", homeTeam: "Teplice", awayTeam: "Sokolov", homeScore: 7, awayScore: 18, maxGoals: 2, tepliceIsHome: true },
  // 5.10.2025
  { date: "2025-10-05", homeTeam: "Most", awayTeam: "Teplice", homeScore: 6, awayScore: 7, maxGoals: 4, tepliceIsHome: false },
  // 11.10.2025 — Turnaj Chomutov
  { date: "2025-10-11", homeTeam: "Chomutov", awayTeam: "Teplice", homeScore: 8, awayScore: 2, maxGoals: 1, tepliceIsHome: false, notes: "Turnaj Chomutov" },
  { date: "2025-10-11", homeTeam: "Litvinov", awayTeam: "Teplice", homeScore: 12, awayScore: 2, maxGoals: 1, tepliceIsHome: false, notes: "Turnaj Chomutov" },
  { date: "2025-10-11", homeTeam: "Teplice", awayTeam: "Teplice", homeScore: 4, awayScore: 2, maxGoals: 3, tepliceIsHome: true, notes: "Turnaj Chomutov — Teplice vs Teplice" },
  { date: "2025-10-11", homeTeam: "Litvinov", awayTeam: "Teplice", homeScore: 4, awayScore: 2, maxGoals: 2, tepliceIsHome: false, notes: "Turnaj Chomutov" },
  { date: "2025-10-11", homeTeam: "Kralupy", awayTeam: "Teplice", homeScore: 5, awayScore: 5, maxGoals: 4, tepliceIsHome: false, notes: "Turnaj Chomutov" },
  { date: "2025-10-11", homeTeam: "Kralupy", awayTeam: "Teplice", homeScore: 1, awayScore: 5, maxGoals: 4, tepliceIsHome: false, notes: "Turnaj Chomutov" },
  // 18.10.2025
  { date: "2025-10-18", homeTeam: "Teplice", awayTeam: "Litoměřice", homeScore: 24, awayScore: 9, maxGoals: 4, tepliceIsHome: true },
  // 26.10.2025
  { date: "2025-10-26", homeTeam: "Chomutov", awayTeam: "Teplice", homeScore: 17, awayScore: 6, maxGoals: 2, tepliceIsHome: false },
  { date: "2025-10-26", homeTeam: "Most", awayTeam: "Teplice", homeScore: 9, awayScore: 10, maxGoals: 5, tepliceIsHome: false },
  // 02.11.2025
  { date: "2025-11-02", homeTeam: "Louny", awayTeam: "Teplice", homeScore: 15, awayScore: 2, maxGoals: 1, tepliceIsHome: false },
  // 16.11.2025
  { date: "2025-11-16", homeTeam: "Teplice", awayTeam: "Most", homeScore: 4, awayScore: 4, maxGoals: 3, tepliceIsHome: true },
  { date: "2025-11-16", homeTeam: "Teplice", awayTeam: "Roudnice", homeScore: 6, awayScore: 2, maxGoals: 4, tepliceIsHome: true },
  { date: "2025-11-16", homeTeam: "Teplice", awayTeam: "Litoměřice", homeScore: 6, awayScore: 8, maxGoals: 3, tepliceIsHome: true },
  // 22.11.2025
  { date: "2025-11-22", homeTeam: "Most", awayTeam: "Teplice", homeScore: 4, awayScore: 5, maxGoals: 3, tepliceIsHome: false },
  { date: "2025-11-22", homeTeam: "Ústí", awayTeam: "Teplice", homeScore: 3, awayScore: 11, maxGoals: 0, tepliceIsHome: false },
  // 29.11.2025
  { date: "2025-11-29", homeTeam: "Litoměřice", awayTeam: "Teplice", homeScore: 7, awayScore: 38, maxGoals: 6, tepliceIsHome: false, notes: "6 třetin (0:5, 2:6, 1:6, 0:7, 3:6, 1:8) + 1 SN tréninkový", periods: 6 },
  // 06.12.2025
  { date: "2025-12-06", homeTeam: "Litvinov", awayTeam: "Teplice", homeScore: 4, awayScore: 2, maxGoals: 2, tepliceIsHome: false },
  { date: "2025-12-06", homeTeam: "Louny", awayTeam: "Teplice", homeScore: 0, awayScore: 2, maxGoals: 2, tepliceIsHome: false },
  { date: "2025-12-06", homeTeam: "Most", awayTeam: "Teplice", homeScore: 4, awayScore: 2, maxGoals: 0, tepliceIsHome: false },
  // 14.12.2025
  { date: "2025-12-14", homeTeam: "Litvinov", awayTeam: "Teplice", homeScore: 6, awayScore: 1, maxGoals: 0, tepliceIsHome: false },
  { date: "2025-12-14", homeTeam: "Litvinov", awayTeam: "Teplice", homeScore: 9, awayScore: 3, maxGoals: 1, tepliceIsHome: false },
  { date: "2025-12-14", homeTeam: "Bílina", awayTeam: "Teplice", homeScore: 9, awayScore: 0, maxGoals: 0, tepliceIsHome: false },
  { date: "2025-12-14", homeTeam: "Bílina", awayTeam: "Teplice", homeScore: 6, awayScore: 1, maxGoals: 0, tepliceIsHome: false },
  { date: "2025-12-14", homeTeam: "Teplice", awayTeam: "Teplice", homeScore: 6, awayScore: 1, maxGoals: 0, tepliceIsHome: true, notes: "Teplice vs Teplice" },
  // 11.01.2026
  { date: "2026-01-11", homeTeam: "Bílina", awayTeam: "Teplice", homeScore: 8, awayScore: 12, maxGoals: 2, tepliceIsHome: false },
  // 13.01.2026
  { date: "2026-01-13", homeTeam: "Most", awayTeam: "Teplice", homeScore: 11, awayScore: 14, maxGoals: 6, tepliceIsHome: false },
  // 18.01.2026
  { date: "2026-01-18", homeTeam: "Most", awayTeam: "Teplice", homeScore: 7, awayScore: 3, maxGoals: 3, tepliceIsHome: false },
  { date: "2026-01-18", homeTeam: "Chomutov", awayTeam: "Teplice", homeScore: 10, awayScore: 4, maxGoals: 1, tepliceIsHome: false },
  { date: "2026-01-18", homeTeam: "Most", awayTeam: "Teplice", homeScore: 8, awayScore: 3, maxGoals: 1, tepliceIsHome: false },
  { date: "2026-01-18", homeTeam: "Chomutov", awayTeam: "Teplice", homeScore: 6, awayScore: 5, maxGoals: 3, tepliceIsHome: false, notes: "2 góly + 1 SN (nájezd)" },
  { date: "2026-01-18", homeTeam: "Teplice", awayTeam: "Teplice", homeScore: 6, awayScore: 6, maxGoals: 1, tepliceIsHome: true, notes: "Teplice vs Teplice" },
  // 25.01.2026 — seskupené zápasy po třetinách
  { date: "2026-01-25", homeTeam: "Chomutov", awayTeam: "Teplice", homeScore: 24, awayScore: 3, maxGoals: 1, tepliceIsHome: false, notes: "3 třetiny: 10:2, 5:1, 9:0", periods: 3 },
  { date: "2026-01-25", homeTeam: "Litvinov", awayTeam: "Teplice", homeScore: 24, awayScore: 4, maxGoals: 1, tepliceIsHome: false, notes: "3 třetiny: 7:1, 9:1, 8:2", periods: 3 },
  // 30.01.2026
  { date: "2026-01-30", homeTeam: "Slavia", awayTeam: "Teplice", homeScore: 14, awayScore: 6, maxGoals: 3, tepliceIsHome: false },
  { date: "2026-01-30", homeTeam: "Litoměřice", awayTeam: "Teplice", homeScore: 21, awayScore: 11, maxGoals: 3, tepliceIsHome: false },
  // 7.2.2026
  { date: "2026-02-07", homeTeam: "Bílina", awayTeam: "Teplice", homeScore: 6, awayScore: 10, maxGoals: 0, tepliceIsHome: false },
  { date: "2026-02-07", homeTeam: "Ústí", awayTeam: "Teplice", homeScore: 3, awayScore: 22, maxGoals: 6, tepliceIsHome: false },
];

const SEASON = "2025-2026";
const PLAYER_FIRST_NAME = "Maxim";
const PLAYER_LAST_NAME = "Petuchov";
const PLAYER_JERSEY = 18;
const PLAYER_DOB = "2018-11-26";

export default function ImportPage() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const totalMaxGoals = MATCHES.reduce((sum, m) => sum + m.maxGoals, 0);
  const totalMatches = MATCHES.length;

  function addLog(msg: string) {
    setLog((prev) => [...prev, msg]);
  }

  async function runImport() {
    setStatus("running");
    setLog([]);

    try {
      // 1. Ensure profile
      addLog("Ověřuji profil...");
      const userId = await ensureProfile(supabase);
      addLog(`✓ Profil OK (${userId.slice(0, 8)}...)`);

      // 2. Create or find player
      addLog(`Hledám hráče ${PLAYER_FIRST_NAME} ${PLAYER_LAST_NAME}...`);
      let { data: existingPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", userId)
        .eq("first_name", PLAYER_FIRST_NAME)
        .eq("last_name", PLAYER_LAST_NAME)
        .single();

      let playerId: string;
      if (existingPlayer) {
        playerId = existingPlayer.id;
        addLog(`✓ Hráč existuje (${playerId.slice(0, 8)}...)`);
      } else {
        const { data: newPlayer, error } = await supabase
          .from("players")
          .insert({
            user_id: userId,
            first_name: PLAYER_FIRST_NAME,
            last_name: PLAYER_LAST_NAME,
            jersey_number: PLAYER_JERSEY,
            date_of_birth: PLAYER_DOB,
          })
          .select("id")
          .single();
        if (error) throw new Error(`Player insert: ${error.message}`);
        playerId = newPlayer!.id;
        addLog(`✓ Hráč vytvořen (${playerId.slice(0, 8)}...)`);
      }

      // 3. Import matches
      let goalCounter = 0;
      for (let i = 0; i < MATCHES.length; i++) {
        const m = MATCHES[i];
        setProgress(Math.round(((i + 1) / MATCHES.length) * 100));

        // Create match
        const { data: match, error: matchError } = await supabase
          .from("matches")
          .insert({
            user_id: userId,
            home_team_name: m.homeTeam,
            away_team_name: m.awayTeam,
            periods_count: m.periods ?? 3,
            period_duration_minutes: null,
            season: SEASON,
            status: "finished",
            current_period: m.periods ?? 3,
            notes: m.notes ?? null,
            created_at: new Date(m.date + "T12:00:00").toISOString(),
          })
          .select("id")
          .single();

        if (matchError) throw new Error(`Match ${i + 1}: ${matchError.message}`);

        // Add Max as match player
        await supabase.from("match_players").insert({
          match_id: match!.id,
          player_id: playerId,
          is_my_player: true,
        });

        // Create goals
        const goals: Array<{
          match_id: string;
          period: number;
          match_time_seconds: null;
          is_home_goal: boolean;
          scorer_player_id: string | null;
          scorer_name: string | null;
          note: null;
        }> = [];

        // Max's goals (on Teplice's side)
        for (let g = 0; g < m.maxGoals; g++) {
          goals.push({
            match_id: match!.id,
            period: 1,
            match_time_seconds: null,
            is_home_goal: m.tepliceIsHome,
            scorer_player_id: playerId,
            scorer_name: `${PLAYER_FIRST_NAME} ${PLAYER_LAST_NAME}`,
            note: null,
          });
          goalCounter++;
        }

        // Remaining Teplice goals (unknown scorers)
        const tepliceScore = m.tepliceIsHome ? m.homeScore : m.awayScore;
        const remainingTeplice = tepliceScore - m.maxGoals;
        for (let g = 0; g < remainingTeplice; g++) {
          goals.push({
            match_id: match!.id,
            period: 1,
            match_time_seconds: null,
            is_home_goal: m.tepliceIsHome,
            scorer_player_id: null,
            scorer_name: null,
            note: null,
          });
        }

        // Opponent goals
        const opponentScore = m.tepliceIsHome ? m.awayScore : m.homeScore;
        for (let g = 0; g < opponentScore; g++) {
          goals.push({
            match_id: match!.id,
            period: 1,
            match_time_seconds: null,
            is_home_goal: !m.tepliceIsHome,
            scorer_player_id: null,
            scorer_name: null,
            note: null,
          });
        }

        if (goals.length > 0) {
          const { error: goalsError } = await supabase.from("goals").insert(goals);
          if (goalsError) throw new Error(`Goals match ${i + 1}: ${goalsError.message}`);
        }

        addLog(`✓ ${i + 1}/${MATCHES.length} — ${m.date} ${m.homeTeam} ${m.homeScore}:${m.awayScore} ${m.awayTeam} (Max: ${m.maxGoals})`);
      }

      addLog(`\n🏒 Import dokončen!`);
      addLog(`   ${MATCHES.length} zápasů`);
      addLog(`   ${goalCounter} gólů Maxima`);
      setStatus("done");
    } catch (err) {
      addLog(`\n❌ Chyba: ${err instanceof Error ? err.message : String(err)}`);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Import zápasů</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Import historických zápasů Maxima Petuchova ze sezóny {SEASON}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalMatches}</p>
          <p className="text-xs text-zinc-400">Zápasů</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{totalMaxGoals}</p>
          <p className="text-xs text-zinc-400">Gólů Maxima</p>
        </div>
      </div>

      {/* Progress */}
      {status === "running" && (
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400 text-center">{progress}%</p>
        </div>
      )}

      {/* Action */}
      {status === "idle" && (
        <Button fullWidth size="lg" onClick={runImport}>
          Spustit import
        </Button>
      )}
      {status === "done" && (
        <div className="space-y-3">
          <Button fullWidth size="lg" onClick={() => router.push("/stats")}>
            Zobrazit statistiky →
          </Button>
          <Button fullWidth variant="secondary" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        </div>
      )}
      {status === "error" && (
        <Button fullWidth size="lg" variant="danger" onClick={runImport}>
          Zkusit znovu
        </Button>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 max-h-64 overflow-y-auto">
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
            {log.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}
