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
            avatar_url: string;
            xp: number;
        }[];

        const bestScores: Results = await prisma.$queryRaw`
            SELECT l.player_id, l.score, l.record_type, p.xp, p.metadata->>'avatar_url' as avatar_url, p.metadata->>'latest_username' as player_username
            FROM leaderboard l
            INNER JOIN player p
            ON l.player_id = p.id
            WHERE "mode" = ${enumMode}::"game_mode"
            AND "language" = ${enumLang}::"language"
            AND rank = 1
        `;

        return {
            bestScores: bestScores.map((score) => ({
                ...score,
                record_type: databaseFieldToRecordEnumMap[score.record_type],
                xp: getLevelDataFromXp(score.xp),
            })),
            maxPage: 1,
        };
    } else {
        const { record, page = 1, perPage = 10 } = params;
        const enumRecord = recordEnumToDatabaseFieldMap[record as TRecord];

        type Results = {
            player_id: string;
            player_username: string;
            score: number;
            rank: number;
            xp: number;
            avatar_url: string;
        }[];

        const bestScores: Results = await prisma.$queryRaw`
            SELECT l.player_id, l.score, l.rank, p.xp, p.metadata->>'avatar_url' as avatar_url, p.metadata->>'latest_username' as player_username
            FROM leaderboard l
            INNER JOIN player p
            ON l.player_id = p.id
            WHERE "mode" = ${enumMode}::"game_mode"
            AND "language" = ${enumLang}::"language"
            AND "record_type" = ${enumRecord}
            AND score > 0
            ORDER BY rank ASC
            LIMIT ${perPage}
            OFFSET ${(page - 1) * perPage}
        `;

        const totalCount: { count: number }[] = await prisma.$queryRaw`
            SELECT CAST(COUNT(*) as int) as count
            FROM leaderboard l
            INNER JOIN player p
            ON l.player_id = p.id
            WHERE "mode" = ${enumMode}::"game_mode"
            AND "language" = ${enumLang}::"language"
            AND "record_type" = ${enumRecord}
            AND score > 0
        `;

        const maxPage = Math.ceil(totalCount[0].count / perPage);

        return {
            bestScores: bestScores.map((score) => ({
                id: score.player_id,
                name: score.player_username,
                score: score.score,
                rank: score.rank,
                xp: getLevelDataFromXp(score.xp),
                avatarUrl: score.avatar_url,
            })),
            maxPage,
        };
    }
}
