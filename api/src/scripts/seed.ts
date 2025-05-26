import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
    let prisma = new PrismaClient();
    await prisma.$connect();

    await prisma.$executeRaw`
        CREATE OR REPLACE FUNCTION set_player_metadata_key(
            p_player_id UUID,
            p_json_key TEXT,
            p_new_value TEXT
        )
        RETURNS VOID
        AS $$
        BEGIN
            UPDATE player
            SET metadata = metadata || jsonb_build_object(p_json_key, p_new_value)
            WHERE id = p_player_id;
        END;
        $$ LANGUAGE plpgsql;
    `;

    await prisma.$executeRaw`
        CREATE OR REPLACE FUNCTION set_player_avatar_url() RETURNS TRIGGER AS $$
        DECLARE
            auth_avatar_hash TEXT;
            auth_id TEXT;
            avatar_url TEXT;
        BEGIN
            SELECT wu.oauth_avatar, wu.oauth_identifier
            INTO auth_avatar_hash, auth_id
            FROM website_user wu
            WHERE wu.id = NEW.website_user_id
            LIMIT 1;

            IF auth_avatar_hash IS NOT NULL AND auth_id IS NOT NULL THEN
                avatar_url := 'https://cdn.discordapp.com/avatars/' || auth_id || '/' || auth_avatar_hash || '.jpg?size=1024';
                
                PERFORM set_player_metadata_key(
                    NEW.player_id,
                    'avatar_url',
                    avatar_url
                );
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `;

    await prisma.$executeRaw`
        CREATE OR REPLACE FUNCTION set_player_latest_username() RETURNS TRIGGER AS $$
            BEGIN
                PERFORM set_player_metadata_key(
                    NEW.player_id,
                    'latest_username',
                    NEW.username
                );
                RETURN NEW;
            END;
        $$ LANGUAGE plpgsql;
    `;

    await prisma.$executeRaw`
        DROP TRIGGER IF EXISTS set_player_latest_username_trigger ON public.player_username;
    `;

    await prisma.$executeRaw`
        DROP TRIGGER IF EXISTS set_player_avatar_url_trigger ON public.website_user_to_player;
    `;

    await prisma.$executeRaw`
        CREATE TRIGGER set_player_latest_username_trigger
        AFTER INSERT OR UPDATE ON player_username
        FOR EACH ROW
        EXECUTE FUNCTION set_player_latest_username();
    `;

    await prisma.$executeRaw`
        CREATE TRIGGER set_player_avatar_url_trigger
        AFTER INSERT OR UPDATE ON website_user_to_player
        FOR EACH ROW
        EXECUTE FUNCTION set_player_avatar_url();
    `;

    await prisma.$executeRaw`
        DROP MATERIALIZED VIEW IF EXISTS pp_leaderboard;
    `;

    await prisma.$executeRaw`
        DROP MATERIALIZED VIEW IF EXISTS leaderboard;
    `;

    await prisma.$executeRaw`
        CREATE MATERIALIZED VIEW leaderboard AS (
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
                        'foods_count',
                        gr.foods_count
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
                    "score" DESC,
                    player_id ASC
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
                        WHEN "record_type" = 'foods_count' THEN (500 / 1500::FLOAT)
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
                        lbct1.pp DESC,
                        lbct1.player_id ASC
                    ) AS INT
                    ) = 1 THEN TRUE
                    ELSE FALSE
                END AS best_pp_in_record_type,
                CAST(lbct1."rank" AS INT) AS "rank"
                FROM
                lbct1
                INNER JOIN player p ON lbct1.player_id = p.id
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
                            lbct2.pp DESC,
                            lbct2.player_id ASC
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
        CREATE MATERIALIZED VIEW pp_leaderboard AS (
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
                    "pp_sum" DESC,
                    "player_id" ASC) AS INT) AS rank
                FROM
                    ct
            );
    `;
}

seed();
