import { createClient } from "@/lib/supabase/server";
import { PlayerList } from "@/components/players/player-list";

export default async function PlayersPage() {
  const supabase = await createClient();
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("created_at", { ascending: false });

  return <PlayerList players={players ?? []} />;
}
