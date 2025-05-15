import prisma from "../prisma";
import { defaultLanguage, TLanguage, TMode } from "../schemas/records.zod";
import {
    databaseEnumToLanguageEnumMap,
    databaseEnumToModeEnumMap,
    PrismaGameMode,
    PrismaLanguage,
} from "./maps";

export let getPlayerPreferredCategory = async function ({
    playerId,
    targetLanguage,
    targetMode,
}: {
    playerId: string;
    targetLanguage?: TLanguage;
    targetMode?: TMode;
}): Promise<{ language: TLanguage; mode: TMode }> {
    if (targetLanguage && targetMode) {
        return {
            language: targetLanguage,
            mode: targetMode,
        };
    }

    const gameRecaps: { language: PrismaLanguage; mode: PrismaGameMode }[] =
        await prisma.$queryRaw`SELECT g."language", g."mode" FROM game_recap gr INNER JOIN game g ON g.id = gr.game_id WHERE gr.player_id = ${playerId}::UUID;`;

    const playerBestLanguageQuery: { language: PrismaLanguage }[] =
        await prisma.$queryRaw`
        SELECT "language"
        FROM pp_leaderboard
        WHERE player_id = ${playerId}::uuid
        ORDER BY pp_sum DESC    
        LIMIT 1
    `;

    const playerBestLanguage = playerBestLanguageQuery[0]?.language;

    if (playerBestLanguage && !targetLanguage) {
        targetLanguage = databaseEnumToLanguageEnumMap[playerBestLanguage];
    }

    if (!targetLanguage) {
        targetLanguage = defaultLanguage;
    }

    if (targetLanguage && targetMode) {
        return {
            language: targetLanguage,
            mode: targetMode,
        };
    }

    type LanguageMode = `${PrismaLanguage}-${PrismaGameMode}`;

    const countPerLanguageMode: Partial<Record<LanguageMode, number>> = {};

    for (const recap of gameRecaps) {
        const lang = recap.language;
        const mode = recap.mode;
        countPerLanguageMode[`${lang}-${mode}`] =
            (countPerLanguageMode[`${lang}-${mode}`] || 0) + 1;
    }

    const preferredLanguageMode = Object.entries(countPerLanguageMode).reduce(
        (acc, [key, value]) => {
            return value > acc.value ? { key, value } : acc;
        },
        { key: "", value: -1 }
    ).key;

    const preferredMode = preferredLanguageMode.split("-")[1] as PrismaGameMode;

    return {
        language: targetLanguage,
        mode: databaseEnumToModeEnumMap[preferredMode],
    };
};
