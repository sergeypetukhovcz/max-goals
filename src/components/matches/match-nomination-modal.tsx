"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Goal, Match, MatchPlayer, Player, Teammate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ErrorBanner } from "@/components/ui/error-banner";
import { NominationPicker, type TeammateOption } from "./nomination-picker";

export type MatchPlayerRow = MatchPlayer & { player?: Player; teammate?: Teammate };

interface MatchNominationModalProps {
  open: boolean;
  onClose: () => void;
  match: Match;
  matchPlayers: MatchPlayerRow[];
  goals: Goal[];
  players: Player[];
  teammates: TeammateOption[];
}

export function MatchNominationModal({
  open,
  onClose,
  match,
  matchPlayers,
  goals,
  players,
  teammates,
}: MatchNominationModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const currentPlayerIds = matchPlayers.filter((mp) => mp.player_id).map((mp) => mp.player_id as string);
  const currentTeammateIds = matchPlayers.filter((mp) => mp.teammate_id).map((mp) => mp.teammate_id as string);
  // Strana našeho týmu — u prázdné nominace výchozí "domácí".
  const currentSide = matchPlayers.find((mp) => mp.is_home !== null)?.is_home ?? true;

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(currentPlayerIds);
  const [selectedTeammateIds, setSelectedTeammateIds] = useState<string[]>(currentTeammateIds);
  const [isHome, setIsHome] = useState<boolean>(currentSide);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kdo už v zápase bodoval — toho nejde z nominace odebrat, gól by ztratil vazbu.
  // Zámek platí jen pro aktuálně nominované; nikoho tím nejde zablokovat přidat.
  const lockedPlayerIds = useMemo(
    () =>
      goals
        .flatMap((g) => [g.scorer_player_id, g.assist_player_id])
        .filter((id): id is string => !!id && currentPlayerIds.includes(id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goals]
  );
  const lockedTeammateIds = useMemo(
    () =>
      goals
        .flatMap((g) => [g.scorer_teammate_id, g.assist_teammate_id])
        .filter((id): id is string => !!id && currentTeammateIds.includes(id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goals]
  );

  // Soupiska naší strany + kdokoli už nominovaný (může být z jiné soupisky).
  // Spoluhráči navázaní na vybraného vlastního hráče se nenabízejí dvakrát.
  const ourTeamId = isHome ? match.home_team_id : match.away_team_id;
  const visibleTeammates = useMemo(
    () =>
      teammates.filter(
        (t) =>
          (t.team_id === ourTeamId || selectedTeammateIds.includes(t.id)) &&
          !selectedPlayerIds.includes(t.player_id ?? "")
      ),
    [teammates, ourTeamId, selectedTeammateIds, selectedPlayerIds]
  );

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }
  function toggleTeammate(id: string) {
    setSelectedTeammateIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedPlayerIds.length === 0) {
      setError("Vyber alespoň jednoho svého hráče");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Nominace se upravuje rozdílově (ne smazat & vložit znovu), aby zůstaly
      // zachované vazby a pořadí u hráčů, kteří v zápase zůstávají.
      const removedIds = matchPlayers
        .filter((mp) =>
          mp.player_id
            ? !selectedPlayerIds.includes(mp.player_id)
            : !selectedTeammateIds.includes(mp.teammate_id ?? "")
        )
        .map((mp) => mp.id);

      if (removedIds.length > 0) {
        const { error: delErr } = await supabase.from("match_players").delete().in("id", removedIds);
        if (delErr) throw delErr;
      }

      const newRows = [
        ...selectedPlayerIds
          .filter((id) => !currentPlayerIds.includes(id))
          .map((playerId) => ({ match_id: match.id, player_id: playerId, is_my_player: true, is_home: isHome })),
        ...selectedTeammateIds
          .filter((id) => !currentTeammateIds.includes(id))
          .map((teammateId) => ({ match_id: match.id, teammate_id: teammateId, is_my_player: false, is_home: isHome })),
      ];
      if (newRows.length > 0) {
        const { error: insErr } = await supabase.from("match_players").insert(newRows);
        if (insErr) throw insErr;
      }

      // Strana platí pro celou nominaci — je zdrojem pravdy pro statistiky.
      if (isHome !== currentSide) {
        const { error: sideErr } = await supabase
          .from("match_players")
          .update({ is_home: isHome })
          .eq("match_id", match.id);
        if (sideErr) throw sideErr;
      }

      setLoading(false);
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nepodařilo se uložit nominaci");
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nominace na zápas">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Za koho hrajeme</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsHome(true)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                isHome ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Domácí — {match.home_team_name}
            </button>
            <button
              type="button"
              onClick={() => setIsHome(false)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                !isHome ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Hosté — {match.away_team_name}
            </button>
          </div>
        </div>

        <NominationPicker
          players={players}
          teammates={visibleTeammates}
          selectedPlayerIds={selectedPlayerIds}
          selectedTeammateIds={selectedTeammateIds}
          onTogglePlayer={togglePlayer}
          onToggleTeammate={toggleTeammate}
          lockedPlayerIds={lockedPlayerIds}
          lockedTeammateIds={lockedTeammateIds}
          groupTeammatesByTeam
          playersLabel="Moji hráči v zápase *"
        />

        <p className="text-xs text-zinc-500">
          Ze zápisu gólu se pak vybírá jen z nominovaných hráčů.
        </p>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Ukládám…" : "Uložit nominaci"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
