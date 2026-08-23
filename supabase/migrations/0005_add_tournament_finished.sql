-- ============================================
-- Migrace 0005: Ukoncení turnaje
-- ============================================
-- Priznak is_finished oznaci turnaj jako dohrany. Takovy turnaj zmizi
-- z planovace (/schedule) i z nabidky pri zakladani zapasu, ale zapasy
-- si drzi tournament_id -> statistiky (filtr a odznak turnaje) zustavaji.
--
-- Spusť jednou v Supabase SQL editoru. Bezpečné a opakovatelně spustitelné.
-- ============================================

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS is_finished BOOLEAN NOT NULL DEFAULT false;
