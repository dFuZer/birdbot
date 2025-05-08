import prisma from "../prisma";
import { defaultLanguage, defaultMode, TLanguage, TMode } from "../schemas/records.zod";
import {
    databaseEnumToLanguageEnumMap,
    databaseEnumToModeEnumMap,
    languageEnumToDatabaseEnumMap,
    modeEnumToDatabaseEnumMap,
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
            language: targetLanguage as TLanguage,
            mode: targetMode as TMode,
        };
    }

    const gameRecaps: { language: PrismaLanguage; mode: PrismaGameMode }[] =
        await prisma.$queryRaw`SELECT g."language", g."mode" FROM game_recap gr INNER JOIN game g ON g.id = gr.game_id WHERE gr.player_id = ${playerId}::UUID;`;

    type LanguageMode = `${PrismaLanguage}-${PrismaGameMode}`;

    const countPerLanguageMode: Partial<Record<LanguageMode, number>> = {};

    for (const recap of gameRecaps) {
        const lang = recap.language;
        const mode = recap.mode;
        countPerLanguageMode[`${lang}-${mode}`] = (countPerLanguageMode[`${lang}-${mode}`] || 0) + 1;
    }

    if (!targetLanguage && !targetMode) {
        const preferredLanguageMode = Object.entries(countPerLanguageMode).reduce(
            (acc, [key, value]) => {
                return value > acc.value ? { key, value } : acc;
            },
            { key: "", value: -1 }
        ).key;

        const [preferredLanguage, preferredMode] = preferredLanguageMode.split("-") as [PrismaLanguage, PrismaGameMode];

        return {
            language: databaseEnumToLanguageEnumMap[preferredLanguage],
            mode: databaseEnumToModeEnumMap[preferredMode],
        };
    } else if (!targetLanguage && targetMode) {
        const preferredLanguageMode = Object.entries(countPerLanguageMode)
            .filter((entry) => entry[0].endsWith(modeEnumToDatabaseEnumMap[targetMode]))
            .reduce(
                (acc, [key, value]) => {
                    return value > acc.value ? { key, value } : acc;
                },
                { key: "", value: -1 }
            ).key;

        if (!preferredLanguageMode) {
            return {
                language: defaultLanguage,
                mode: targetMode,
            };
        }
        const [preferredLanguage, _] = preferredLanguageMode.split("-") as [PrismaLanguage, PrismaGameMode];

        return {
            language: databaseEnumToLanguageEnumMap[preferredLanguage],
            mode: targetMode,
        };
    } else if (targetLanguage && !targetMode) {
        const preferredLanguageMode = Object.entries(countPerLanguageMode)
            .filter((entry) => entry[0].startsWith(languageEnumToDatabaseEnumMap[targetLanguage]))
            .reduce(
                (acc, [key, value]) => {
                    return value > acc.value ? { key, value } : acc;
                },
                { key: "", value: -1 }
            ).key;

        if (!preferredLanguageMode) {
            return {
                language: targetLanguage,
                mode: defaultMode,
            };
        }

        const [_, preferredMode] = preferredLanguageMode.split("-") as [PrismaLanguage, PrismaGameMode];

        return {
            language: targetLanguage,
            mode: databaseEnumToModeEnumMap[preferredMode],
        };
    } else {
        throw new Error("Should not happen");
    }
};
