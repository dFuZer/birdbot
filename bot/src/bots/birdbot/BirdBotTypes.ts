import { z } from "zod";
import type { Resource } from "../../lib/class/ResourceManager.class";
import { RoomTargetConfig } from "../../lib/class/Room.class";
import { SubmitResultType } from "../../lib/types/gameTypes";
import type { birdbotSupportedDictionaryIds, languageEnumSchema, modesEnumSchema, recordsEnumSchema } from "./BirdBotConstants";

export type CacheableDictionaryMetadata = {
    letterRarityScores: Record<string, number>;
    syllablesCount: Record<string, number>;
    topFlipWords: [string, number][];
    topSnWords: [string, number][];
};

export type DictionaryMetadata = CacheableDictionaryMetadata & {
    testWords: { word: string; callbackRoomCode: string }[];
    language: BirdBotLanguage;
    resourceFilePath: string;
    metadataFilePath: string;
    changed: boolean;
};
export type DictionaryResource = Resource<string[], DictionaryMetadata>;

export type ListedRecordListMetadata = {
    language: BirdBotLanguage;
    resourceFilePath: string;
};
export type ListedRecordListResource = Resource<string[], ListedRecordListMetadata>;

export type BirdBotLanguage = z.infer<typeof languageEnumSchema>;
export type BirdBotGameMode = z.infer<typeof modesEnumSchema>;
export type BirdBotRecordType = z.infer<typeof recordsEnumSchema>;
export type BirdBotListedRecord = "slur" | "creature" | "ethnonym" | "chemical" | "plant" | "adverb" | "food";

export type BirdBotPlaystyle =
    | "regular"
    | "alpha"
    | "previous_syllable"
    | "flips"
    | "depleted_syllables"
    | "multi_syllable"
    | "hyphen"
    | "more_than_20_letters"
    | BirdBotListedRecord;

export type BirdBotTrainingSort = "shuffle" | "sn" | "ms" | "l" | "s";

export type BirdBotTrainingCondition =
    | { type: "alpha" }
    | { type: "previous_syllable" }
    | { type: "multi_syllable" }
    | { type: "hyphen" }
    | { type: "more_than_20_letters" };

export type BirdBotTrainingSource = "dictionary" | "low_sub_words" | BirdBotListedRecord;

export type BirdBotTrainingListState = {
    source: BirdBotTrainingSource;
    sort: BirdBotTrainingSort;
    conditions: BirdBotTrainingCondition[];
    regexSources: string[];
    successes: number;
    attempts: number;
};

export type BirdBotTrainingState = {
    creatorAuthId: string;
    list: BirdBotTrainingListState | null;
};

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
    slurs: number;
    creatures: number;
    ethnonyms: number;
    chemicals: number;
    plants: number;
    foods: number;
    adverbs: number;
};

export type GlobalGameScores = {
    flips: number;
    depletedSyllables: number;
    previousSyllables: number;
    hyphenWords: number;
    moreThan20LettersWords: number;
    multiSyllables: number;
    slurs: number;
    creatures: number;
    ethnonyms: number;
    chemicals: number;
    plants: number;
    foods: number;
    adverbs: number;
};

export type BirdbotRoomTargetConfig = {
    birdbotGameMode: BirdBotGameMode;
} & RoomTargetConfig;

export type BirdBotRoomMetadata = {
    gameMode: BirdBotGameMode | "custom";
    gameplayLanguage: BirdBotLanguage;
    playstyle: BirdBotPlaystyle;
    training: BirdBotTrainingState | null;
    rankedBlockedUntilSeating: boolean;
    nextDelayMs: number;
    scoresByPeerId: Record<string, PlayerGameScores>;
    globalScores: GlobalGameScores;
    remainingSyllables: Record<string, number>;
    wasInitialized: boolean;
    hostLeftIteration: number;
    greetedPeerIds: Set<string>;
    pendingWordRegistrations: Map<string, PendingBirdBotWordRegistration>;
    flipTurnKeys: Set<string>;
    scoredWordTurnKeys: Set<string>;
};

export type ExperienceData = {
    xp: number;
    level: number;
    currentLevelXp: number;
    totalLevelXp: number;
    percentageToNextLevel: number;
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

export type BirdBotWordMilestone = {
    type: "SPEED" | "ACCURACY";
    category: BirdBotRecordType;
    milestone: number;
    value: number;
    idempotencyKey: string;
    metadata: Record<string, unknown>;
};

export type BirdBotWordData = {
    game: BirdBotGameData;
    player: BirdBotPlayerData;
    word: string;
    submitResult: SubmitResultType;
    prompt: string;
    flip: boolean;
    durationMs?: number;
    reactionMs?: number;
    milestones?: BirdBotWordMilestone[];
};

export type PendingBirdBotWordRegistration = {
    turnKey: string;
    data: Omit<BirdBotWordData, "flip">;
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
    slursCount: number;
    creaturesCount: number;
    ethnonymsCount: number;
    chemicalsCount: number;
    plantsCount: number;
    foodsCount: number;
    adverbsCount: number;
};
