import type { TMode } from "../schemas/records.zod";

const creditModeMultiplier = {
    regular: 1,
    easy: 0.8,
    blitz: 1.8,
    sub500: 1.3,
    sub50: 1.8,
    freeplay: 0.6,
} satisfies { [key in TMode]: number };

/**
 * BirdBot credits earned from a scored game.
 * Kept intentionally smaller than XP so VIP purchases remain meaningful.
 */
export function calculateCreditsFromGameRecap(gameRecap: {
    mode: TMode;
    wordsCount: number;
    flipsCount: number;
    depletedSyllablesCount: number;
    alphaCount: number;
    wordsWithoutDeathCount: number;
    previousSyllablesCount: number;
    multiSyllablesCount: number;
    listedRecordsTotalCount: number;
}): number {
    if (gameRecap.wordsCount <= 0) return 0;
    const raw =
        gameRecap.wordsCount * 1 +
        gameRecap.flipsCount * 5 +
        gameRecap.depletedSyllablesCount * 2 +
        gameRecap.alphaCount * 2 +
        gameRecap.wordsWithoutDeathCount * 0.5 +
        gameRecap.previousSyllablesCount * 1.5 +
        gameRecap.multiSyllablesCount * 1.5 +
        gameRecap.listedRecordsTotalCount * 2;
    return Math.max(0, Math.floor(raw * creditModeMultiplier[gameRecap.mode]));
}
