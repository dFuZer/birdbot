export function calculateXpFromGameRecap(gameRecap: {
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
        Math.max(gameRecap.time / 10000, 10) + // 1 xp per 10 seconds (min 10 xp per game)
        gameRecap.wordsCount * 1 + // 1 xp per word
        gameRecap.flipsCount * 20 + // 20 xp per flip
        gameRecap.depletedSyllablesCount * 4 + // 4 xp per depleted syllable
        gameRecap.alphaCount * 2 + // 2 xp per alpha word
        gameRecap.wordsWithoutDeathCount * 1 + // 1 xp per word without death
        gameRecap.previousSyllablesCount * 3 + // 3 xp per previous syllable
        gameRecap.multiSyllablesCount * 3 + // 3 xp per multi syllable
        gameRecap.listedRecordsTotalCount * 2 // 2 xp per listed record
    );
}
