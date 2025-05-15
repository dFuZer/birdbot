import { TMode } from "../schemas/records.zod";
export type ExperienceData = {
    xp: number;
    level: number;
    currentLevelXp: number;
    totalLevelXp: number;
    percentageToNextLevel: number;
};

const xpPerMode = {
    regular: 1,
    easy: 0.8,
    blitz: 1.8,
    sub500: 1.3,
    sub50: 1.8,
    freeplay: 0.6,
} satisfies { [key in TMode]: number };

export function calculateXpFromGameRecap(gameRecap: {
    mode: TMode;
    time: number;
    wordsCount: number;
    flipsCount: number;
    depletedSyllablesCount: number;
    alphaCount: number;
    wordsWithoutDeathCount: number;
    previousSyllablesCount: number;
    multiSyllablesCount: number;
    listedRecordsTotalCount: number;
}) {
    return (
        (Math.max(gameRecap.time / 10000, 10) + // 1 xp per 10 seconds (min 10 xp per game)
            gameRecap.wordsCount * 1 + // 1 xp per word
            gameRecap.flipsCount * 20 + // 20 xp per flip
            gameRecap.depletedSyllablesCount * 4 + // 4 xp per depleted syllable
            gameRecap.alphaCount * 2 + // 2 xp per alpha word
            gameRecap.wordsWithoutDeathCount * 1 + // 1 xp per word without death
            gameRecap.previousSyllablesCount * 3 + // 3 xp per previous syllable
            gameRecap.multiSyllablesCount * 3 + // 3 xp per multi syllable
            gameRecap.listedRecordsTotalCount * 2) * // 2 xp per listed record
        xpPerMode[gameRecap.mode]
    );
}

function computeXpPerLevel() {
    const xpPerLevel = [0];
    for (let level = 1; level <= 200; level++) {
        const xp = Math.round(level * 20 + level ** 2.5);
        xpPerLevel.push(xp);
    }
    return xpPerLevel;
}

const xpPerLevel = computeXpPerLevel();

function levelFromXp(xp: number) {
    return xpPerLevel.findIndex((levelXp) => {
        return xp < levelXp;
    });
}

function xpFromLevel(level: number) {
    if (level === 0) return 0;
    return xpPerLevel[level - 1];
}

export function getLevelDataFromXp(xp: number) {
    const currentLevel = levelFromXp(xp);
    const nextLevel = currentLevel + 1;
    const currentLevelTotalXp = xpFromLevel(currentLevel);
    const nextLevelTotalXp = xpFromLevel(nextLevel);

    return {
        xp,
        level: levelFromXp(xp),
        currentLevelXp: xp - currentLevelTotalXp,
        totalLevelXp: nextLevelTotalXp - currentLevelTotalXp,
        percentageToNextLevel:
            ((xp - currentLevelTotalXp) /
                (nextLevelTotalXp - currentLevelTotalXp)) *
            100,
    };
}
