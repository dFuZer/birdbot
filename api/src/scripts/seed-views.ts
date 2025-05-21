import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
    let prisma = new PrismaClient();
    await prisma.$connect();

    await prisma.$executeRaw`
        create or replace view player_latest_username as
            (with un as (
                select p.id as player_id, pu.username as player_username, row_number() over (partition by pu.player_id order by pu.created_at desc) as recency_rank
                from player_username pu
                inner join player p
                on pu.player_id = p.id
            )
            select player_id, player_username as username from un where recency_rank = 1
        )
    `;

    await prisma.$executeRaw`
        CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard AS (
            WITH all_scores AS (
                SELECT DISTINCT
                ON (
                    gr.player_id,
                    g."language",
                    g."mode",
                    v.record_type
                ) gr.player_id,
                g."language",
                g."mode",
                v.record_type,
                v.score
                FROM
                game_recap gr
                INNER JOIN game g ON gr.game_id = g.id
                JOIN LATERAL (
                    VALUES
                    ('words_count', gr.words_count),
                    ('flips_count', gr.flips_count),
                    (
                        'depleted_syllables_count',
                        gr.depleted_syllables_count
                    ),
                    (
                        'words_without_death_count',
                        gr.words_without_death_count
                    ),
                    ('alpha_count', gr.alpha_count),
                    (
                        'previous_syllables_count',
                        gr.previous_syllables_count
                    ),
                    ('multi_syllables_count', gr.multi_syllables_count),
                    ('hyphen_words_count', gr.hyphen_words_count),
                    (
                        'more_than_20_letters_words_count',
                        gr.more_than_20_letters_words_count
                    ),
                    (
                        'slurs_count',
                        gr.slurs_count
                    ),
                    (
                        'creatures_count',
                        gr.creatures_count
                    ),
                    (
                        'ethnonyms_count',
                        gr.ethnonyms_count
                    ),
                    (
                        'chemicals_count',
                        gr.chemicals_count
                    ),
                    (
                        'plants_count',
                        gr.plants_count
                    ),
                    (
                        'adverbs_count',
                        gr.adverbs_count
                    ),
                    (
                        'time',
                        EXTRACT(
                        EPOCH
                        FROM
                            (gr.died_at - g.started_at)
                        ) * 1000
                    )
                ) AS v ("record_type", "score") ON TRUE
                ORDER BY
                gr.player_id,
                g."language",
                g."mode",
                v.record_type,
                v.score DESC
            ),
            lbct1 AS (
                SELECT
                player_id,
                "language",
                "mode",
                "record_type",
                "score",
                ROW_NUMBER() OVER (
                    PARTITION BY
                    "language",
                    "mode",
                    "record_type"
                    ORDER BY
                    "score" DESC
                ) AS "rank",
                ROUND(
                    "score" * (
                    CASE
                        WHEN "record_type" = 'time' THEN (500 / 18000000::FLOAT)
                        WHEN "record_type" = 'words_count' THEN (500 / 7000::FLOAT)
                        WHEN "record_type" = 'flips_count' THEN (500 / 350::FLOAT)
                        WHEN "record_type" = 'depleted_syllables_count' THEN (500 / 1100::FLOAT)
                        WHEN "record_type" = 'alpha_count' THEN (500 / 2600::FLOAT)
                        WHEN "record_type" = 'words_without_death_count' THEN (500 / 2000::FLOAT)
                        WHEN "record_type" = 'multi_syllables_count' THEN (500 / 1500::FLOAT)
                        WHEN "record_type" = 'previous_syllables_count' THEN (500 / 1500::FLOAT)
                        WHEN "record_type" = 'hyphen_words_count' THEN (500 / 1500::FLOAT)
                        WHEN "record_type" = 'more_than_20_letters_words_count' THEN (500 / 1500::FLOAT)
                        WHEN "record_type" = 'slurs_count' THEN (500 / 1500::FLOAT)
                        WHEN "record_type" = 'creatures_count' THEN (500 / 1500::FLOAT)
                        WHEN "record_type" = 'ethnonyms_count' THEN (500 / 1500::FLOAT)
                        WHEN "record_type" = 'chemicals_count' THEN (500 / 1500::FLOAT)
                        WHEN "record_type" = 'plants_count' THEN (500 / 1500::FLOAT)
                        WHEN "record_type" = 'adverbs_count' THEN (500 / 1500::FLOAT)
                        ELSE 0
                    END
                    ) * (
                    CASE
                        WHEN "mode" = 'REGULAR'::"game_mode" THEN 1.0::FLOAT
                        WHEN "mode" = 'EASY'::"game_mode" THEN 0.7::FLOAT
                        WHEN "mode" = 'BLITZ'::"game_mode" THEN 2.2::FLOAT
                        WHEN "mode" = 'SUB500'::"game_mode" THEN 1.5::FLOAT
                        WHEN "mode" = 'SUB50'::"game_mode" THEN 2.2::FLOAT
                        WHEN "mode" = 'FREEPLAY'::"game_mode" THEN 0.4::FLOAT
                        ELSE 0
                    END
                    )
                ) AS pp
                FROM
                all_scores
            ),
            lbct2 AS (
                SELECT
                lbct1.player_id AS player_id,
                lbct1."language" AS "language",
                lbct1."mode" AS "mode",
                lbct1.record_type AS record_type,
                lbct1.score AS score,
                lbct1.pp AS pp,
                CASE
                    WHEN CAST(
                    ROW_NUMBER() OVER (
                        PARTITION BY
                        lbct1.player_id,
                        lbct1."language",
                        lbct1.record_type
                        ORDER BY
                        lbct1.pp DESC
                    ) AS INT
                    ) = 1 THEN TRUE
                    ELSE FALSE
                END AS best_pp_in_record_type,
                plu.username AS player_username,
                CAST(lbct1."rank" AS INT) AS "rank"
                FROM
                lbct1
                INNER JOIN player_latest_username plu ON lbct1.player_id = plu.player_id
            ),
            lbct3 AS (
                SELECT
                *,
                CAST(GREATEST(
                    0.0,
                    1.0 - (
                    (
                        ROW_NUMBER() OVER (
                        PARTITION BY
                            lbct2.player_id,
                            lbct2."language",
                            lbct2.best_pp_in_record_type
                        ORDER BY
                            lbct2.pp DESC
                        ) - 1
                    ) * 0.12
                    )
                ) AS FLOAT) AS pp_weight
                FROM
                lbct2
            ),
            lbct4 AS (
                SELECT
                *,
                ROUND(lbct3.pp * lbct3.pp_weight) AS weighted_pp
                FROM
                lbct3
            )
            SELECT
            *
            FROM
            lbct4
        );
    `;

    await prisma.$executeRaw`
        CREATE MATERIALIZED VIEW IF NOT EXISTS pp_leaderboard AS (
            WITH ct AS (
                SELECT
                DISTINCT ON
                    ("player_id",
                    "language",
                    "pp_sum")
                "player_id",
                    "language",
                    SUM("weighted_pp") OVER (PARTITION BY player_id,
                    "language") AS pp_sum
                FROM
                    leaderboard l
                WHERE
                    best_pp_in_record_type = TRUE
                ORDER BY
                    "language",
                    "pp_sum" DESC)
                SELECT
                    *,
                    CAST(ROW_NUMBER() OVER (PARTITION BY "language"
                ORDER BY
                    "pp_sum" DESC) AS INT) AS rank
                FROM
                    ct
            );
    `;
}

seed();
