-- ============================================
-- Migrace 0004: Turnaje
-- ============================================
-- Turnaj sdružuje více zápasů, má datum/místo a nominaci hráčů.
-- Zápas může (ale nemusí) spadat pod turnaj přes matches.tournament_id.
--
-- Spusť jednou v Supabase SQL editoru. Bezpečné a opakovatelně spustitelné.
-- ============================================

-- 1. Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  start_date DATE,
  end_date DATE,
  season TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can insert own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can update own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can delete own tournaments" ON tournaments;
CREATE POLICY "Users can view own tournaments"
  ON tournaments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tournaments"
  ON tournaments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tournaments"
  ON tournaments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tournaments"
  ON tournaments FOR DELETE USING (auth.uid() = user_id);

-- 2. Tournament players (nominace — moji hráči + spoluhráči)
CREATE TABLE IF NOT EXISTS tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  teammate_id UUID REFERENCES teammates(id) ON DELETE CASCADE,
  is_my_player BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tournament_players_one_ref CHECK (
    (player_id IS NOT NULL AND teammate_id IS NULL) OR
    (player_id IS NULL AND teammate_id IS NOT NULL)
  )
);

ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tournament_players" ON tournament_players;
DROP POLICY IF EXISTS "Users can insert own tournament_players" ON tournament_players;
DROP POLICY IF EXISTS "Users can update own tournament_players" ON tournament_players;
DROP POLICY IF EXISTS "Users can delete own tournament_players" ON tournament_players;
CREATE POLICY "Users can view own tournament_players"
  ON tournament_players FOR SELECT USING (
    EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_players.tournament_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own tournament_players"
  ON tournament_players FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_players.tournament_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Users can update own tournament_players"
  ON tournament_players FOR UPDATE USING (
    EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_players.tournament_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own tournament_players"
  ON tournament_players FOR DELETE USING (
    EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_players.tournament_id AND t.user_id = auth.uid())
  );

-- 3. Link matches to a tournament (optional)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_user_id ON tournaments(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
