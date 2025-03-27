import { z } from "zod";
import Logger from "../lib/logger";
import prisma from "../prisma/client";
import { getRecords, languageEnumSchema, modesEnumSchema, recordsEnumSchema } from "../schemas/records.zod";
import { languageEnumToDatabaseEnumMap, modeEnumToDatabaseEnumMap, recordEnumToDatabaseFieldMap, type TOrderByField } from "./maps";

type Results = {
    player_id: string;
    player_username: string;
    score: number;
    rank: number;
}[];

export default async function getBestScoresForCategory(params: z.infer<typeof getRecords>) {
    const { mode, lang, page, perPage, record } = params;

    const selectedRecordColumn = recordEnumToDatabaseFieldMap[record as TOrderByField];

    // Should be useless, but you can never be too sure ^^
    if (
        !recordsEnumSchema.safeParse(record).success ||
        !languageEnumSchema.safeParse(lang).success ||
        !modesEnumSchema.safeParse(mode).success ||
        typeof perPage !== "number" ||
        typeof page !== "number"
    ) {
        const e = new Error("Unsafe arguments");
        Logger.error({ message: "Unsafe arguments", path: "getBestScoresForRecord.ts", errorType: "unknown", error: e });
        throw e;
    }

    const scoreGetter = record === "time" ? `EXTRACT(EPOCH FROM (gr.died_at - g.started_at)) * 1000` : `gr."${selectedRecordColumn}"`;

    const bestScores: Results = await prisma.$queryRawUnsafe(`
            WITH best_scores AS (
                SELECT DISTINCT ON (gr.player_id) 
                    gr.player_id, 
                    plu.username AS player_username, 
                    ${scoreGetter} AS score
                FROM game_recap gr
                INNER JOIN game g ON g.id = gr.game_id
                INNER JOIN player_latest_username plu ON plu.player_id = gr.player_id
                WHERE g."mode" = '${modeEnumToDatabaseEnumMap[mode]}'
                AND g."language" = '${languageEnumToDatabaseEnumMap[lang]}'
                ORDER BY gr.player_id, score DESC
            )
            SELECT 
                bs.player_id as player_id, 
                bs.player_username as player_username, 
                bs.score as score, 
                cast (ROW_NUMBER() OVER (ORDER BY bs.score DESC) AS int) as rank
            FROM best_scores bs
            LIMIT ${perPage}
            OFFSET ${(page - 1) * perPage}
        `);

    return bestScores;
}
