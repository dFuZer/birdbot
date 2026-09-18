ALTER TABLE "player" RENAME COLUMN "account_name" TO "auth_id";
ALTER TABLE "bot_staff" RENAME COLUMN "account_name" TO "auth_id";

DROP MATERIALIZED VIEW IF EXISTS player_word_metrics;

CREATE MATERIALIZED VIEW player_word_metrics AS
WITH player_word AS (
    SELECT w.player_id, w.word, g.language, COUNT(*)::bigint AS times_used
    FROM word w
    INNER JOIN game g ON g.id = w.game_id
    INNER JOIN player p ON p.id = w.player_id
    WHERE w.submit_result = 'SUCCESS'
      AND btrim(p.auth_id) <> ''
      AND lower(p.auth_id) <> 'birdbot'
    GROUP BY w.player_id, w.word, g.language
),
word_player_count AS (
    SELECT word, language, COUNT(*)::int AS player_count
    FROM player_word
    GROUP BY word, language
)
SELECT
    pw.player_id,
    pw.language,
    SUM(pw.times_used)::bigint AS words_placed,
    COUNT(*)::int AS distinct_words,
    COUNT(*) FILTER (WHERE wpc.player_count = 1)::int AS exclusive_words,
    (COUNT(*)::double precision / NULLIF(SUM(pw.times_used), 0)) AS variety,
    (COUNT(*) FILTER (WHERE wpc.player_count = 1)::double precision
        / NULLIF(SUM(pw.times_used), 0)) AS unicity
FROM player_word pw
INNER JOIN word_player_count wpc ON wpc.word = pw.word AND wpc.language = pw.language
GROUP BY pw.player_id, pw.language;

CREATE UNIQUE INDEX player_word_metrics_player_id_language_uidx
ON player_word_metrics (player_id, language);
