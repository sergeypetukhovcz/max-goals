-- ============================================
-- Migrace 0002: Perzistence časomíry zápasu v DB
-- ============================================
-- Časomíra dosud žila jen v localStorage prohlížeče, takže běžící zápas
-- se po reloadu nebo na jiném zařízení zobrazil jako 00:00.
--
--   timer_elapsed_seconds  = čas nasčítaný v předchozích (pozastavených) úsecích
--   timer_started_at       = začátek aktuálně běžícího úseku (NULL = časomíra stojí)
--
-- Aktuální čas = timer_elapsed_seconds + (now() - timer_started_at), když běží.
--
-- Spusť jednou v Supabase SQL editoru. Bezpečné a opakovatelně spustitelné.
-- ============================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS timer_elapsed_seconds INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMPTZ;
