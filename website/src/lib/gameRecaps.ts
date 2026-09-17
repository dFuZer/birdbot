import { LanguageEnum, ModesEnum } from "@/lib/records";

export type GameRecapSummary = {
    id: string;
    gameId: string;
    playerId: string;
    accountName: string;
    username: string;
    language: LanguageEnum;
    mode: ModesEnum;
    startedAt: string;
    endedAt: string | null;
    diedAt: string;
    wordsCount: number;
    flipsCount: number;
    depletedSyllablesCount: number;
    alphaCount: number;
    wordsWithoutDeathCount: number;
    previousSyllablesCount: number;
    multiSyllablesCount: number;
    hyphenWordsCount: number;
    moreThan20LettersWordsCount: number;
    slursCount: number;
    creaturesCount: number;
    ethnonymsCount: number;
    chemicalsCount: number;
    plantsCount: number;
    adverbsCount: number;
    foodsCount: number;
    durationMs: number;
};

export type GameRecapsPage = {
    recaps: GameRecapSummary[];
    nextCursor: string | null;
};

export type GameRecapDetail = {
    recap: GameRecapSummary;
    gameWordCount: number;
    playersInGame: {
        recapId: string;
        accountName: string;
        username: string;
        wordsCount: number;
    }[];
};

export type GameRecapExport = {
    generatedAt: string;
    recap: GameRecapSummary;
    playersInGame: GameRecapDetail["playersInGame"];
    words: GameWordRow[];
};

export type GameWordSubmitResult = "success" | "failsPrompt" | "invalidWord" | "noText" | "alreadyUsed" | "bombExploded";

export type GameWordRow = {
    id: string;
    createdAt: string;
    word: string;
    prompt: string;
    flip: boolean;
    submitResult: GameWordSubmitResult;
    durationMs: number | null;
    reactionMs: number | null;
    playerId: string;
    accountName: string;
    username: string;
};

export type GameWordsPage = {
    rows: GameWordRow[];
    totalCount: number;
    nextCursor: string | null;
};
