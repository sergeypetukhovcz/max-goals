-- ============================================
-- Max Goals - Hockey Tracker Database Schema v2
-- ============================================
-- IMPORTANT: This replaces the old schema completely.
-- Run the migration script below FIRST if you have the old schema,
-- then run this full schema.
-- ============================================

-- ============================================
-- MIGRATION: Drop old tables (run this first if upgrading)
-- ============================================
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS match_players CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS team_players CASCADE;
DROP TABLE IF EXISTS teammates CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- 1. Profiles (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. Players (user's tracked players)
-- ============================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  jersey_number INT,
  photo_url TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own players"
  ON players FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own players"
  ON players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own players"
  ON players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own players"
  ON players FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. Teams (with city, birth year, colors)
-- ============================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  birth_year TEXT,
  color_primary TEXT NOT NULL DEFAULT '#cc0000',
  color_secondary TEXT NOT NULL DEFAULT '#ffffff',
  default_color TEXT NOT NULL DEFAULT 'primary' CHECK (default_color IN ('primary', 'secondary')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teams"
  ON teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own teams"
  ON teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own teams"
  ON teams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own teams"
  ON teams FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. Teammates (team roster - both "my players" and manual entries)
-- ============================================
CREATE TABLE teammates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  jersey_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teammates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teammates"
  ON teammates FOR SELECT USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = teammates.team_id AND teams.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own teammates"
  ON teammates FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = teammates.team_id AND teams.user_id = auth.uid())
  );
CREATE POLICY "Users can update own teammates"
  ON teammates FOR UPDATE USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = teammates.team_id AND teams.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own teammates"
  ON teammates FOR DELETE USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = teammates.team_id AND teams.user_id = auth.uid())
  );

-- ============================================
-- 5. Matches (reworked: home/away teams, optional timer)
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  home_team_name TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  periods_count INT NOT NULL DEFAULT 3,
  period_duration_minutes INT,
  season TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'paused', 'finished')),
  current_period INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own matches"
  ON matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own matches"
  ON matches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own matches"
  ON matches FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. Match Players (who participates in a match)
-- ============================================
CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  teammate_id UUID REFERENCES teammates(id) ON DELETE SET NULL,
  is_my_player BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT match_players_one_ref CHECK (
    (player_id IS NOT NULL AND teammate_id IS NULL) OR
    (player_id IS NULL AND teammate_id IS NOT NULL)
  )
);

ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own match_players"
  ON match_players FOR SELECT USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = match_players.match_id AND matches.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own match_players"
  ON match_players FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = match_players.match_id AND matches.user_id = auth.uid())
  );
CREATE POLICY "Users can update own match_players"
  ON match_players FOR UPDATE USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = match_players.match_id AND matches.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own match_players"
  ON match_players FOR DELETE USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = match_players.match_id AND matches.user_id = auth.uid())
  );

-- ============================================
-- 7. Goals (with optional time, notes)
-- ============================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  period INT NOT NULL,
  match_time_seconds INT,
  is_home_goal BOOLEAN NOT NULL,
  scorer_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  scorer_teammate_id UUID REFERENCES teammates(id) ON DELETE SET NULL,
  scorer_name TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = goals.match_id AND matches.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = goals.match_id AND matches.user_id = auth.uid())
  );
CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = goals.match_id AND matches.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = goals.match_id AND matches.user_id = auth.uid())
  );

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_teams_user_id ON teams(user_id);
CREATE INDEX idx_teammates_team_id ON teammates(team_id);
CREATE INDEX idx_teammates_player_id ON teammates(player_id);
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_season ON matches(season);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_match_players_match_id ON match_players(match_id);
CREATE INDEX idx_match_players_player_id ON match_players(player_id);
CREATE INDEX idx_goals_match_id ON goals(match_id);
CREATE INDEX idx_goals_scorer_player ON goals(scorer_player_id);
