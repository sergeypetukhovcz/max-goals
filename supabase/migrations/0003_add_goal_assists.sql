-- ============================================
-- Migrace 0003: Asistence u gólů
-- ============================================
-- Ke gólu lze nově zapsat jednoho asistenta (můj hráč, spoluhráč, nebo jméno).
-- Všechna pole jsou nepovinná — staré góly zůstávají beze změny.
--
-- Spusť jednou v Supabase SQL editoru. Bezpečné a opakovatelně spustitelné.
-- ============================================

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS assist_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assist_teammate_id UUID REFERENCES teammates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assist_name TEXT;

CREATE INDEX IF NOT EXISTS idx_goals_assist_player ON goals(assist_player_id);
