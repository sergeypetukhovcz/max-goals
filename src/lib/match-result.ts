export type MatchResult = "win" | "loss" | "draw" | "unknown";

/**
 * Výsledek zápasu z pohledu sledovaného hráče.
 *
 * `playerIsHome` je jediný zdroj pravdy o straně hráče — pochází z
 * match_players.is_home. Dřívější odhady podle jména týmu / prvního gólu
 * selhávaly u zápasů "tým vs stejný tým", proto se už nepoužívají.
 * Vrací "unknown", když strana není známá (is_home === null).
 */
export function getMatchResult(
  playerIsHome: boolean | null,
  homeScore: number,
  awayScore: number
): MatchResult {
  if (playerIsHome === null) return "unknown";
  const playerScore = playerIsHome ? homeScore : awayScore;
  const opponentScore = playerIsHome ? awayScore : homeScore;
  if (playerScore > opponentScore) return "win";
  if (playerScore < opponentScore) return "loss";
  return "draw";
}
