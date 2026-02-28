export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export type Player = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  photo_url: string | null;
  date_of_birth: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  user_id: string;
  name: string;
  city: string | null;
  birth_year: string | null;
  color_primary: string;
  color_secondary: string;
  default_color: "primary" | "secondary";
  created_at: string;
};

export type Teammate = {
  id: string;
  team_id: string;
  player_id: string | null;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  created_at: string;
};

export type MatchStatus = "not_started" | "in_progress" | "paused" | "finished";

export type Match = {
  id: string;
  user_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team_name: string;
  away_team_name: string;
  periods_count: number;
  period_duration_minutes: number | null;
  season: string;
  notes: string | null;
  status: MatchStatus;
  current_period: number;
  created_at: string;
};

export type MatchPlayer = {
  id: string;
  match_id: string;
  player_id: string | null;
  teammate_id: string | null;
  is_my_player: boolean;
  created_at: string;
};

export type Goal = {
  id: string;
  match_id: string;
  period: number;
  match_time_seconds: number | null;
  is_home_goal: boolean;
  scorer_player_id: string | null;
  scorer_teammate_id: string | null;
  scorer_name: string | null;
  note: string | null;
  created_at: string;
};

// Joined types for UI convenience
export type GoalWithScorer = Goal & {
  scorer_display_name: string;
};

export type MatchWithGoals = Match & {
  goals: Goal[];
  home_score: number;
  away_score: number;
};

export type TeammateWithPlayer = Teammate & {
  player?: Player;
};
