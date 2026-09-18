import prisma from "../prisma";
import { TLanguage, TMode } from "../schemas/records.zod";
import { getDiscordAvatarUrl } from "./discord";
import {
    databaseEnumToLanguageEnumMap,
    databaseEnumToModeEnumMap,
    databaseFieldToRecordEnumMap,
    GameRecapRecordField,
    languageEnumToDatabaseEnumMap,
    modeEnumToDatabaseEnumMap,
    PrismaGameMode,
    PrismaLanguage,
} from "./maps";
import { getLevelDataFromXp } from "./xp";

export default async function getPlayerProfile({
    playerId,
    mode,
    language,
}: {
    playerId: string;
    mode: TMode;
    language: TLanguage;
}) {
    const playerQuery: {
        id: string;
        auth_id: string;
        xp: number;
        username: string;
        discord_user_id: string | null;
        discord_avatar_hash: string | null;
    }[] = await prisma.$queryRaw`
        SELECT
            p.id,
            p.auth_id,
            COALESCE(p.metadata->>'profile_name', p.metadata->>'latest_username') AS username,
            p.xp,
            wu.oauth_identifier AS discord_user_id,
            wu.oauth_avatar AS discord_avatar_hash
        FROM player p
        LEFT JOIN website_user_to_player wup ON wup.player_id = p.id
        LEFT JOIN website_user wu ON wu.id = wup.website_user_id
        WHERE p.id = ${playerId}::UUID
        LIMIT 1
    `;
    const player = playerQuery[0];

    if (!player) {
        return null;
    }

    const records: { record_type: GameRecapRecordField; score: number; rank: number }[] = await prisma.$queryRaw`
        SELECT record_type, score, rank
        FROM leaderboard
        WHERE player_id = ${player.id}::UUID
        AND language = ${languageEnumToDatabaseEnumMap[language]}::"language"
        AND mode = ${modeEnumToDatabaseEnumMap[mode]}::"game_mode"
    `;

    const bestPerformances: {
        record_type: GameRecapRecordField;
        score: number;
        pp: number;
        weighted_pp: number;
        mode: PrismaGameMode;
        pp_weight: number;
    }[] = await prisma.$queryRaw`
        SELECT "mode", "record_type", "score", "pp", "weighted_pp", "pp_weight"
        FROM leaderboard l
        WHERE l.player_id = ${player.id}::UUID
        AND best_pp_in_record_type = TRUE
        AND "language" = ${languageEnumToDatabaseEnumMap[language]}::"language"
        ORDER BY weighted_pp DESC
    `;

    const ppLeaderboardProfile: {
        player_id: string;
        pp_sum: number;
        rank: number;
        language: PrismaLanguage;
    }[] = await prisma.$queryRaw`
        SELECT player_id, pp_sum, rank, "language"
        FROM pp_leaderboard
        WHERE player_id = ${player.id}::UUID
    `;

    const gamesPlayedCount: { games_played_count: number }[] = await prisma.$queryRaw`
        SELECT CAST(COUNT(*) AS INT) AS games_played_count
        FROM game_recap
        WHERE player_id = ${player.id}::UUID
    `;

    const recordsCount: { records_count: number }[] = await prisma.$queryRaw`
        SELECT CAST(COUNT(*) AS INT) AS records_count
        FROM leaderboard
        WHERE player_id = ${player.id}::UUID
        AND rank = 1
    `;

    const currentLanguagePpProfile = ppLeaderboardProfile.find(
        (profile) => profile.language === languageEnumToDatabaseEnumMap[language]
    );

    if (!recordsCount[0] || !gamesPlayedCount[0]) {
        return null;
    }

    const res = {
        avatarUrl: getDiscordAvatarUrl(player.discord_user_id, player.discord_avatar_hash),
        playerId: player.id,
        playerAuthId: player.auth_id,
        playerUsername: player.username,
        xp: getLevelDataFromXp(player.xp),
        language,
        mode,
        gamesPlayedCount: gamesPlayedCount[0].games_played_count,
        recordsCount: recordsCount[0].records_count,
        pp: currentLanguagePpProfile ? currentLanguagePpProfile.pp_sum : 0,
        ppPerLanguage: ppLeaderboardProfile.reduce((acc, curr) => {
            acc[databaseEnumToLanguageEnumMap[curr.language]] = curr.pp_sum;
            return acc;
        }, {} as Record<TLanguage, number>),
        ppRank: currentLanguagePpProfile ? currentLanguagePpProfile.rank : 0,
        records: records.map((record) => {
            return { ...record, record_type: databaseFieldToRecordEnumMap[record.record_type] };
        }),
        bestPerformances: bestPerformances
            .filter((performance) => performance.weighted_pp > 0)
            .map((performance) => {
                return {
                    ...performance,
                    mode: databaseEnumToModeEnumMap[performance.mode],
                    record_type: databaseFieldToRecordEnumMap[performance.record_type],
                };
            }),
    };

    return res;
}
