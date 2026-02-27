-- ============================================
-- Max Goals - Hockey Tracker Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query)
-- ============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Players (parent's children)
CREATE TABLE IF NOT EXISTS players (
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
  ON players FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own players"
  ON players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own players"
  ON players FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own players"
  ON players FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teams"
  ON teams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teams"
  ON teams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own teams"
  ON teams FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Team-Player relationship (M:N)
CREATE TABLE IF NOT EXISTS team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team_players"
  ON team_players FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_players.team_id AND teams.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own team_players"
  ON team_players FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_players.team_id AND teams.user_id = auth.uid())
  );

CREATE POLICY "Users can update own team_players"
  ON team_players FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_players.team_id AND teams.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own team_players"
  ON team_players FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_players.team_id AND teams.user_id = auth.uid())
  );

-- 5. Teammates (other players in the team, not parent's children)
CREATE TABLE IF NOT EXISTS teammates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jersey_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teammates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teammates"
  ON teammates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = teammates.team_id AND teams.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own teammates"
  ON teammates FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = teammates.team_id AND teams.user_id = auth.uid())
  );

CREATE POLICY "Users can update own teammates"
  ON teammates FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = teammates.team_id AND teams.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own teammates"
  ON teammates FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = teammates.team_id AND teams.user_id = auth.uid())
  );

-- 6. Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent_name TEXT NOT NULL,
  is_home BOOLEAN DEFAULT TRUE,
  periods_count INT DEFAULT 3,
  period_duration_minutes INT DEFAULT 15,
  team_color TEXT DEFAULT '#cc0000',
  opponent_color TEXT DEFAULT '#0044cc',
  season TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('scheduled', 'in_progress', 'finished')),
  current_period INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own matches"
  ON matches FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  period INT NOT NULL,
  match_time_seconds INT NOT NULL,
  is_our_goal BOOLEAN NOT NULL,
  scorer_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  scorer_teammate_id UUID REFERENCES teammates(id) ON DELETE SET NULL,
  scorer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = goals.match_id AND matches.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = goals.match_id AND matches.user_id = auth.uid())
  );

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = goals.match_id AND matches.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM matches WHERE matches.id = goals.match_id AND matches.user_id = auth.uid())
  );

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON team_players(player_id);
CREATE INDEX IF NOT EXISTS idx_teammates_team_id ON teammates(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season);
CREATE INDEX IF NOT EXISTS idx_matches_player_id ON matches(player_id);
CREATE INDEX IF NOT EXISTS idx_goals_match_id ON goals(match_id);
