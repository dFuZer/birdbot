import { z } from "zod";
import type { Resource } from "../../lib/class/ResourceManager.class";
import type {
    birdbotSupportedDictionaryIds,
    languageEnumSchema,
    modesEnumSchema,
    recordsEnumSchema,
} from "./BirdBotConstants";

export type DictionaryMetadata = {
    letterRarityScores: Record<string, number>;
    syllablesCount: Record<string, number>;
};

export type DictionaryResource = Resource<string[], DictionaryMetadata>;

export type BirdBotLanguage = z.infer<typeof languageEnumSchema>;
export type BirdBotGameMode = z.infer<typeof modesEnumSchema>;
export type BirdBotRecordType = z.infer<typeof recordsEnumSchema>;

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

export type BirdBotSupportedDictionaryId = (typeof birdbotSupportedDictionaryIds)[number];

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
