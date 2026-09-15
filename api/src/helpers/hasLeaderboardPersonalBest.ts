import type { GameMode, Language } from "@prisma/client";
import type { z } from "zod";
import prisma from "../prisma";
import type { gameRecap } from "../schemas/game.zod";
import type { GameRecapRecordField } from "./maps";

export default async function hasLeaderboardPersonalBest({
    playerId,
    language,
    mode,
    recap,
    gameStartedAt,
}: {
    playerId: string;
    language: Language;
    mode: GameMode;
    recap: z.infer<typeof gameRecap>;
    gameStartedAt: Date;
}): Promise<boolean> {
    const existingScores: { record_type: GameRecapRecordField; score: unknown }[] = await prisma.$queryRaw`
        SELECT record_type, score
        FROM leaderboard
        WHERE player_id = ${playerId}::UUID
            AND language = ${language}::"language"
            AND mode = ${mode}::"game_mode"
    `;

    const bestByType = new Map<string, number>();
    for (const row of existingScores) {
        bestByType.set(row.record_type, Number(row.score));
    }

    const recapScores: Array<[GameRecapRecordField, number]> = [
        ["words_count", recap.wordsCount],
        ["flips_count", recap.flipsCount],
        ["depleted_syllables_count", recap.depletedSyllablesCount],
        ["words_without_death_count", recap.wordsWithoutDeathCount],
        ["alpha_count", recap.alphaCount],
        ["previous_syllables_count", recap.previousSyllablesCount],
        ["multi_syllables_count", recap.multiSyllablesCount],
        ["hyphen_words_count", recap.hyphenWordsCount],
        ["more_than_20_letters_words_count", recap.moreThan20LettersWordsCount],
        ["slurs_count", recap.slursCount],
        ["creatures_count", recap.creaturesCount],
        ["ethnonyms_count", recap.ethnonymsCount],
        ["chemicals_count", recap.chemicalsCount],
        ["plants_count", recap.plantsCount],
        ["foods_count", recap.foodsCount],
        ["adverbs_count", recap.adverbsCount],
        ["time", recap.diedAt - gameStartedAt.getTime()],
    ];

    for (const [recordType, score] of recapScores) {
        if (score <= 0) {
            continue;
        }
        const previous = bestByType.get(recordType);
        if (previous === undefined || score > previous) {
            return true;
        }
    }

    return false;
}
