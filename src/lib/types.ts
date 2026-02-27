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
  created_at: string;
};

export type TeamPlayer = {
  id: string;
  team_id: string;
  player_id: string;
  is_primary: boolean;
  created_at: string;
};

export type Teammate = {
  id: string;
  team_id: string;
  name: string;
  jersey_number: number | null;
  created_at: string;
};

export type MatchStatus = "scheduled" | "in_progress" | "finished";

export type Match = {
  id: string;
  user_id: string;
  player_id: string;
  team_id: string;
  opponent_name: string;
  is_home: boolean;
  periods_count: number;
  period_duration_minutes: number;
  team_color: string;
  opponent_color: string;
  season: string;
  status: MatchStatus;
  current_period: number;
  created_at: string;
};

export type Goal = {
  id: string;
  match_id: string;
  period: number;
  match_time_seconds: number;
  is_our_goal: boolean;
  scorer_player_id: string | null;
  scorer_teammate_id: string | null;
  scorer_name: string | null;
  created_at: string;
};
