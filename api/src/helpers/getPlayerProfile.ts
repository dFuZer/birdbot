import prisma from "../prisma";
import { TLanguage, TMode } from "../schemas/records.zod";
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
    const playerQuery: { id: string; account_name: string; xp: number; username: string }[] =
        await prisma.$queryRaw`SELECT p.id, p.account_name, plu.username, p.xp FROM player p INNER JOIN player_latest_username plu ON plu.player_id = p.id WHERE p.id = ${playerId}::UUID LIMIT 1`;
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
        (profile) => profile.language === languageEnumToDatabaseEnumMap[language],
    );

    if (!recordsCount[0] || !gamesPlayedCount[0]) {
        return null;
    }

    const res = {
        playerId: player.id,
        playerAccountName: player.account_name,
        playerUsername: player.username,
        xp: getLevelDataFromXp(player.xp),
        language,
        mode,
        gamesPlayedCount: gamesPlayedCount[0].games_played_count,
        recordsCount: recordsCount[0].records_count,
        pp: currentLanguagePpProfile ? currentLanguagePpProfile.pp_sum : 0,
        ppPerLanguage: ppLeaderboardProfile.reduce(
            (acc, curr) => {
                acc[databaseEnumToLanguageEnumMap[curr.language]] = curr.pp_sum;
                return acc;
            },
            {} as Record<TLanguage, number>,
        ),
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
