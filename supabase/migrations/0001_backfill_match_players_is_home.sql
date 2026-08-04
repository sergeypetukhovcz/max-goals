-- ============================================
-- Migrace 0001: Doplnění match_players.is_home u existujících dat
-- ============================================
-- Sloupec is_home ve schématu existuje, ale u dříve vytvořených a
-- importovaných zápasů nebyl vyplněn. Statistiky (V/R/P) se bez něj
-- musely odhadovat heuristikou, která selhává u zápasů "Teplice vs Teplice".
--
-- Spusť CELÝ tento skript jednou v Supabase SQL editoru.
-- Je bezpečný a opakovatelně spustitelný (mění jen řádky, kde is_home IS NULL).
-- ============================================

-- Krok 1 — obecné pravidlo:
-- odvoď stranu hráče z gólu, který v daném zápase sám vstřelil.
-- Funguje pro všechny zápasy, kde "můj hráč" alespoň jednou skóroval.
UPDATE match_players mp
SET is_home = g.is_home_goal
FROM goals g
WHERE mp.is_home IS NULL
  AND mp.player_id IS NOT NULL
  AND g.match_id = mp.match_id
  AND g.scorer_player_id = mp.player_id;

-- Krok 2 — fallback pro zápasy, kde hráč nedal gól:
-- sledovaný hráč (Maxim) hraje vždy za svůj tým "HC Teplice Huskies",
-- takže jeho strana je ta, na které v zápase tento tým stojí.
-- (U dvojzápasu "HC Teplice Huskies vs HC Teplice Huskies" tím vyjde domácí,
--  což odpovídá původnímu importu.)
UPDATE match_players mp
SET is_home = (m.home_team_name = 'HC Teplice Huskies')
FROM matches m
WHERE mp.is_home IS NULL
  AND mp.player_id IS NOT NULL
  AND m.id = mp.match_id
  AND (m.home_team_name = 'HC Teplice Huskies' OR m.away_team_name = 'HC Teplice Huskies');

-- Kontrola — kolik řádků "mých hráčů" ještě nemá stranu (ideálně 0):
-- SELECT count(*) FROM match_players WHERE is_home IS NULL AND player_id IS NOT NULL;
