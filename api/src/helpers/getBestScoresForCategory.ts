import { z } from "zod";
import prisma from "../prisma";
import { getRecords, TLanguage, TMode, TRecord } from "../schemas/records.zod";
import {
    databaseFieldToRecordEnumMap,
    GameRecapRecordField,
    languageEnumToDatabaseEnumMap,
    modeEnumToDatabaseEnumMap,
    recordEnumToDatabaseFieldMap,
} from "./maps";

export default async function getBestScoresForCategory(params: z.infer<typeof getRecords>) {
    const { mode, lang } = params;

    const enumMode = modeEnumToDatabaseEnumMap[mode as TMode];
    const enumLang = languageEnumToDatabaseEnumMap[lang as TLanguage];

    if (!("record" in params)) {
        type Results = {
            player_id: string;
            player_username: string;
            score: number;
            record_type: GameRecapRecordField;
        }[];

        const bestScores: Results = await prisma.$queryRaw`
            SELECT player_id, player_username, score, record_type
            FROM leaderboard
            WHERE "mode" = ${enumMode}::"game_mode"
            AND "language" = ${enumLang}::"language"
            AND rank = 1
        `;

        return bestScores.map((score) => ({
            ...score,
            record_type: databaseFieldToRecordEnumMap[score.record_type],
        }));
    } else {
        const { record, page, perPage } = params;
        const enumRecord = recordEnumToDatabaseFieldMap[record as TRecord];

        type Results = {
            player_id: string;
            player_username: string;
            score: number;
            rank: number;
        }[];

        const bestScores: Results = await prisma.$queryRaw`
            SELECT player_id, player_username, score, rank
            FROM leaderboard
            WHERE "mode" = ${enumMode}::"game_mode"
            AND "language" = ${enumLang}::"language"
            AND "record_type" = ${enumRecord}
            ORDER BY score DESC
            LIMIT ${perPage}    
            OFFSET ${(page - 1) * perPage}
        `;

        return bestScores;
    }
}
