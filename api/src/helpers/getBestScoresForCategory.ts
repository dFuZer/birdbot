import { z } from "zod";
import prisma from "../prisma";
import { getRecords, TLanguage, TMode, TRecord } from "../schemas/records.zod";
import { getDiscordAvatarUrl } from "./discord";
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
            auth_id: string;
            xp: number;
        }[];

        const bestScores: Results = await prisma.$queryRaw`
            SELECT l.player_id,
                l.score,
                l.record_type,
                p.xp,
                p.metadata->>'latest_username' as player_username,
                p.auth_id
            FROM leaderboard l
            INNER JOIN player p
            ON l.player_id = p.id
            WHERE "mode" = ${enumMode}::"game_mode"
            AND "language" = ${enumLang}::"language"
            AND rank = 1
        `;

        return {
            bestScores: bestScores.map((score) => ({
                id: score.player_id,
                name: score.player_username,
                authId: score.auth_id,
                score: score.score,
                recordType: databaseFieldToRecordEnumMap[score.record_type],
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
            discord_user_id: string | null;
            discord_avatar_hash: string | null;
            auth_id: string;
            game_recap_id: string | null;
        }[];

        const bestScores: Results = await prisma.$queryRaw`
            SELECT l.player_id,
                l.score,
                l.rank,
                l.game_recap_id,
                p.xp,
                wu.oauth_identifier AS discord_user_id,
                wu.oauth_avatar AS discord_avatar_hash,
                p.metadata->>'latest_username' as player_username,
                p.auth_id
            FROM leaderboard l
            INNER JOIN player p
            ON l.player_id = p.id
            LEFT JOIN website_user_to_player wup
            ON wup.player_id = p.id
            LEFT JOIN website_user wu
            ON wu.id = wup.website_user_id
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
                authId: score.auth_id,
                score: score.score,
                rank: score.rank,
                xp: getLevelDataFromXp(score.xp),
                avatarUrl: getDiscordAvatarUrl(score.discord_user_id, score.discord_avatar_hash),
                recapId: score.game_recap_id,
            })),
            maxPage,
        };
    }
}
