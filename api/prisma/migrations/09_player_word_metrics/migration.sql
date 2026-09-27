CREATE INDEX "word_success_player_word_idx"
ON "word" ("player_id", "word")
WHERE "submit_result" = 'SUCCESS';

CREATE MATERIALIZED VIEW player_word_metrics AS
WITH player_word AS (
    SELECT player_id, word, COUNT(*)::bigint AS times_used
    FROM word
    WHERE submit_result = 'SUCCESS'
    GROUP BY player_id, word
),
word_player_count AS (
    SELECT word, COUNT(*)::int AS player_count
    FROM player_word
    GROUP BY word
)
SELECT
    pw.player_id,
    SUM(pw.times_used)::bigint AS words_placed,
    COUNT(*)::int AS distinct_words,
    COUNT(*) FILTER (WHERE wpc.player_count = 1)::int AS exclusive_words,
    (COUNT(*)::double precision / NULLIF(SUM(pw.times_used), 0)) AS variety,
    (COUNT(*) FILTER (WHERE wpc.player_count = 1)::double precision
        / NULLIF(SUM(pw.times_used), 0)) AS unicity
FROM player_word pw
INNER JOIN word_player_count wpc ON wpc.word = pw.word
GROUP BY pw.player_id;

CREATE UNIQUE INDEX player_word_metrics_player_id_uidx
ON player_word_metrics (player_id);
