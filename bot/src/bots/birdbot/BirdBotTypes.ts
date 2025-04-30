import { z } from "zod";
import type { Resource } from "../../lib/class/ResourceManager.class";
import { SubmitResultType } from "../../lib/types/gameTypes";
import type { birdbotSupportedDictionaryIds, languageEnumSchema, modesEnumSchema, recordsEnumSchema } from "./BirdBotConstants";

export type DictionaryMetadata = {
    letterRarityScores: Record<string, number>;
    syllablesCount: Record<string, number>;
    topFlipWords: { word: string; score: number }[];
    topSnWords: { word: string; score: number }[];
};

export type DictionaryResource = Resource<string[], DictionaryMetadata>;

export type BirdBotLanguage = z.infer<typeof languageEnumSchema>;
export type BirdBotGameMode = z.infer<typeof modesEnumSchema>;
export type BirdBotRecordType = z.infer<typeof recordsEnumSchema>;

export type BirdBotSupportedDictionaryId = (typeof birdbotSupportedDictionaryIds)[number];

export type PlayerGameScores = {
    words: number;
    flips: number;
    depletedSyllables: number;
    alpha: number;
    currentWordsWithoutDeath: number;
    maxWordsWithoutDeath: number;
    previousSyllableScore: number;
    previousSyllable: string | null;
    multiSyllables: number;
    hyphenWords: number;
    moreThan20LettersWords: number;
};

export type BirdBotRoomMetadata = {
    gameMode: BirdBotGameMode | "custom";
    scoresByGamerId: Record<string, PlayerGameScores>;
    remainingSyllables: Record<string, number>;
};

export type BirdBotGameData = {
    id: string;
    lang: BirdBotLanguage;
    mode: BirdBotGameMode;
};

export type BirdBotPlayerData = {
    accountName: string;
    nickname: string;
};

export type BirdBotWordData = {
    game: BirdBotGameData;
    player: BirdBotPlayerData;
    word: string;
    submitResult: SubmitResultType;
    prompt: string;
    flip: boolean;
};

export type BirdBotGameRecap = {
    game: BirdBotGameData;
    player: BirdBotPlayerData;
    diedAt: number;
    wordsCount: number;
    flipsCount: number;
    depletedSyllablesCount: number;
    alphaCount: number;
    wordsWithoutDeathCount: number;
    previousSyllablesCount: number;
    multiSyllablesCount: number;
    hyphenWordsCount: number;
    moreThan20LettersWordsCount: number;
};
