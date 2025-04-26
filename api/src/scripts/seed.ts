import { PrismaClient } from "@prisma/client";

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
        CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard AS (WITH all_scores AS (
        SELECT
            DISTINCT ON
            (gr.player_id,
            g."language",
            g."mode",
            v.record_type) gr.player_id,
            g."language",
            g."mode",
            v.record_type,
            v.score
        FROM
            game_recap gr
        INNER JOIN game g ON
            gr.game_id = g.id
        JOIN LATERAL (
        VALUES
            ('words_count',
        gr.words_count),
            ('flips_count',
        gr.flips_count),
            ('depleted_syllables_count',
        gr.depleted_syllables_count),
            ('words_without_death_count',
        gr.words_without_death_count),
            ('alpha_count',
        gr.alpha_count),
            ('previous_syllables_count',
        gr.previous_syllables_count),
            ('multi_syllables_count',
        gr.multi_syllables_count),
            ('hyphen_words_count',
        gr.hyphen_words_count),
            ('more_than_20_letters_words_count',
        gr.more_than_20_letters_words_count),
        	('time',
        EXTRACT(EPOCH FROM (gr.died_at - g.started_at)) * 1000)
        ) AS v("record_type",
            "score") ON
            TRUE
        ORDER BY
            gr.player_id,
            g."language",
            g."mode",
            v.record_type,
            v.score DESC),
        lb AS (
        SELECT
            player_id,
            "language",
            "mode",
            "record_type",
            "score",
            ROW_NUMBER() OVER (PARTITION BY "language",
            "mode",
            "record_type"
        ORDER BY
            "score" DESC) AS RANK
        FROM
            all_scores)
        SELECT
            lb.player_id as player_id,
            lb."language" as language,
            lb."mode" as mode,
            lb.record_type as record_type,
            lb.score as score,
            plu.username as player_username,
            cast(lb.rank as int) as rank
        FROM
            lb
        INNER JOIN player_latest_username plu
            ON
            lb.player_id = plu.player_id
        );
    `;
}

seed();
