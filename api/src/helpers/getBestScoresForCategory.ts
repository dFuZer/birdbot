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
import { getLevelDataFromXp } from "./xp";

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
            xp: number;
        }[];

        const bestScores: Results = await prisma.$queryRaw`
            SELECT l.player_id, l.player_username, l.score, l.record_type, p.xp
            FROM leaderboard l
            INNER JOIN player p
            ON l.player_id = p.id
            WHERE "mode" = ${enumMode}::"game_mode"
            AND "language" = ${enumLang}::"language"
            AND rank = 1
        `;

        return bestScores.map((score) => ({
            ...score,
            record_type: databaseFieldToRecordEnumMap[score.record_type],
            xp: getLevelDataFromXp(score.xp),
        }));
    } else {
        const { record, page = 1, perPage = 10 } = params;
        const enumRecord = recordEnumToDatabaseFieldMap[record as TRecord];

        type Results = {
            player_id: string;
            player_username: string;
            score: number;
            rank: number;
            xp: number;
        }[];

        const bestScores: Results = await prisma.$queryRaw`
            SELECT l.player_id, l.player_username, l.score, l.rank, p.xp
            FROM leaderboard l
            INNER JOIN player p
            ON l.player_id = p.id
            WHERE "mode" = ${enumMode}::"game_mode"
            AND "language" = ${enumLang}::"language"
            AND "record_type" = ${enumRecord}
            ORDER BY score DESC
            LIMIT ${perPage}    
            OFFSET ${(page - 1) * perPage}
        `;

        return bestScores.map((score) => ({
            ...score,
            xp: getLevelDataFromXp(score.xp),
        }));
    }
}
