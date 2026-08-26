// Sčítání gólů podle střelců — sdílené detailem zápasu i detailem turnaje.
//
// Góly soupeře se nesledují jmenovitě (nemají střelce), proto se do přehledu
// počítají jen góly _našeho_ týmu. Naše strana se pozná z match_players.is_home;
// góly bez vyplněného střelce na naší straně spadnou do řádku "Neznámý".

export interface ScorerGoal {
  is_home_goal: boolean;
  scorer_player_id: string | null;
  scorer_teammate_id: string | null;
  scorer_name: string | null;
}

export interface SideRoster {
  is_home: boolean | null;
  is_my_player: boolean;
}

export interface ScorerRow {
  key: string;
  name: string; // zobrazený název; "Neznámý" pro góly bez střelce
  goals: number;
}

export const UNKNOWN_SCORER = "Neznámý";

/**
 * Na které straně (`is_home`) hrál sledovaný tým — z nominace daného zápasu.
 * Spolehlivým signálem jsou vlastní hráči (`is_my_player`); jinak libovolný
 * hráč se známou stranou. Vrací `null`, když strana není z nominace určitelná.
 */
export function deriveOurSide(roster: SideRoster[]): boolean | null {
  const mine = roster.find((r) => r.is_my_player && r.is_home !== null);
  if (mine) return mine.is_home;
  const any = roster.find((r) => r.is_home !== null);
  return any ? any.is_home : null;
}

/** Góly, které v daném zápase patří sledovanému týmu. */
export function ourGoals<T extends ScorerGoal>(goals: T[], ourSide: boolean | null): T[] {
  if (ourSide !== null) return goals.filter((g) => g.is_home_goal === ourSide);
  // Strana neznámá → bereme aspoň góly s vyplněným střelcem (nezanášíme
  // soupeřovy góly do "Neznámý").
  return goals.filter((g) => g.scorer_player_id || g.scorer_teammate_id || g.scorer_name);
}

function scorerKey(g: ScorerGoal): string {
  if (g.scorer_player_id) return `p:${g.scorer_player_id}`;
  if (g.scorer_teammate_id) return `t:${g.scorer_teammate_id}`;
  if (g.scorer_name) return `n:${g.scorer_name}`;
  return "unknown";
}

/**
 * Sečte góly (už zúžené na náš tým) podle střelců, seřazeno sestupně.
 * Stejný hráč napříč zápasy se spojí přes player_id / teammate_id.
 */
export function scorerTotals(goals: ScorerGoal[]): ScorerRow[] {
  const map = new Map<string, ScorerRow>();
  for (const g of goals) {
    const key = scorerKey(g);
    const existing = map.get(key);
    if (existing) {
      existing.goals += 1;
    } else {
      map.set(key, { key, name: g.scorer_name ?? UNKNOWN_SCORER, goals: 1 });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.goals - a.goals || a.name.localeCompare(b.name, "cs")
  );
}
