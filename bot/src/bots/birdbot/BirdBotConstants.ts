import { z } from "zod";
import Utilitary from "../../lib/class/Utilitary.class";
import { DictionaryId, DictionaryLessGameRules } from "../../lib/types/gameTypes";
import { BirdBotGameMode, BirdBotLanguage, BirdBotRecordType, BirdBotSupportedDictionaryId } from "./BirdBotTypes";

export const DISCORD_SERVER_LINK = "https://discord.com/invite/J3yHjv4ZUd";
export const GITHUB_REPO_LINK = "https://github.com/dFuZer/birdbot";
export const PAYPAL_DONATE_LINK = "https://www.paypal.com/paypalme/enzotomassi";
export const WEBSITE_LINK = "https://birdbot.gg";

const birdbotRulesBase = {
    roundsToWin: 1,
    scoreGoal: 100,
    gameMode: "survival",
    minWordLengthOption: "0",
    promptDifficulty: "custom",
} satisfies Omit<DictionaryLessGameRules, "bombDuration" | "customPromptDifficulty" | "maxLives" | "startingLives">;

const birdbotRegularModeRules = {
    ...birdbotRulesBase,
    bombDuration: 5,
    customPromptDifficulty: 1,
    maxLives: 3,
    startingLives: 2,
} satisfies DictionaryLessGameRules;

const birdbotEasyModeRules = {
    ...birdbotRulesBase,
    bombDuration: 7,
    customPromptDifficulty: 400,
    maxLives: 3,
    startingLives: 3,
} satisfies DictionaryLessGameRules;

const birdbotBlitzModeRules = {
    ...birdbotRulesBase,
    bombDuration: 3,
    customPromptDifficulty: 1,
    maxLives: 2,
    startingLives: 3,
} satisfies DictionaryLessGameRules;

const birdbotSub500ModeRules = {
    ...birdbotRulesBase,
    bombDuration: 5,
    customPromptDifficulty: -500,
    maxLives: 3,
    startingLives: 2,
} satisfies DictionaryLessGameRules;

const birdbotSub50ModeRules = {
    ...birdbotRulesBase,
    bombDuration: 5,
    customPromptDifficulty: -50,
    maxLives: 3,
    startingLives: 2,
} satisfies DictionaryLessGameRules;

const birdbotFreeplayModeRules = {
    ...birdbotRulesBase,
    bombDuration: 10,
    customPromptDifficulty: 1,
    maxLives: 10,
    startingLives: 10,
} satisfies DictionaryLessGameRules;

export const defaultBirdBotBombPartyRules = birdbotRegularModeRules satisfies DictionaryLessGameRules;

export const birdbotModeRules = {
    regular: birdbotRegularModeRules,
    easy: birdbotEasyModeRules,
    blitz: birdbotBlitzModeRules,
    sub500: birdbotSub500ModeRules,
    sub50: birdbotSub50ModeRules,
    freeplay: birdbotFreeplayModeRules,
} satisfies Record<BirdBotGameMode, DictionaryLessGameRules>;

export const birdbotLanguageToDictionaryId = {
    fr: "fr",
    en: "en",
    de: "de",
    es: "es",
    brpt: "pt-BR",
    it: "it",
} satisfies Record<BirdBotLanguage, DictionaryId>;

export const dictionaryIdToBirdbotLanguage = {
    "fr": "fr",
    "en": "en",
    "de": "de",
    "es": "es",
    "pt-BR": "brpt",
    "it": "it",
} satisfies Record<BirdBotSupportedDictionaryId, BirdBotLanguage>;

export const birdbotSupportedDictionaryIds = ["fr", "en", "de", "es", "pt-BR", "it"] satisfies DictionaryId[];
export const languageEnumSchema = z.enum(["fr", "en", "de", "es", "brpt", "it"]);
export const modesEnumSchema = z.enum(["regular", "easy", "blitz", "sub500", "sub50", "freeplay"]);
export const recordsEnumSchema = z.enum(["word", "time", "multi_syllable", "previous_syllable", "flips", "depleted_syllables", "no_death", "alpha", "hyphen", "more_than_20_letters"]);

export const defaultLanguage = "en" satisfies BirdBotLanguage;
export const defaultMode = "regular" satisfies BirdBotGameMode;

export const languageAliases = {
    fr: ["french", "fr", "francais", "français", "fra"],
    en: ["english", "en", "anglais", "anglais", "ang", "eng", "englais" /*  "englais" ça arrive plus souvent que ce qu'on croit */],
    de: ["german", "de", "deutsch", "deutsch", "allemand", "ger"],
    es: ["spanish", "es", "español", "español", "espagnol", "esp"],
    brpt: ["brasileiro", "brpt", "portuguese", "portugais", "br", "pt", "portugais"],
    it: ["italian", "it", "italiano", "italiano", "italien", "it"],
} satisfies Record<BirdBotLanguage, string[]>;

export const recordAliases = {
    word: ["words", "word", "mots", "mot", "mots", "w", "m"],
    time: ["time", "temps", "temp", "t"],
    multi_syllable: ["multi-syllable", "multi-syllables", "ms", "multi", "m"],
    previous_syllable: ["previous-syllable", "previous-syllables", "previous", "prev", "ps", "p"],
    flips: ["flips", "flip", "life", "lives", "vie", "vies", "v"],
    depleted_syllables: ["depleted-syllables", "syllables-depleted", "depleted", "syll", "sn"],
    no_death: ["no-death", "nd", "sans-mort", "sm", "nodeath"],
    alpha: ["alpha", "alp", "a"],
    hyphen: ["hyphen", "hyp", "hyph", "compose", "mot-compose", "mot-composes", "h"],
    more_than_20_letters: ["more-than-20-letters", "20+", "plus-de-20-lettres", "long", "longs", "20-letters", "20", "l"],
} satisfies Record<BirdBotRecordType, string[]>;

export const sortWordsModeRecords = ["flips", "multi_syllable", "depleted_syllables"] satisfies BirdBotRecordType[];
export const filterWordsModeRecords = ["hyphen", "more_than_20_letters"] satisfies BirdBotRecordType[];

export const recordsUtils = {
    word: {
        format: (score) => score.toString(),
        order: 1,
    },
    time: {
        format: Utilitary.formatTime,
        order: 2,
    },
    flips: {
        format: (score) => score.toString(),
        order: 3,
    },
    depleted_syllables: {
        format: (score) => score.toString(),
        order: 4,
    },
    alpha: {
        format: Utilitary.displayAlphaScore,
        order: 5,
    },
    no_death: {
        format: (score) => score.toString(),
        order: 6,
    },
    multi_syllable: {
        format: (score) => score.toString(),
        order: 7,
    },
    previous_syllable: {
        format: (score) => score.toString(),
        order: 8,
    },
    more_than_20_letters: {
        format: (score) => score.toString(),
        order: 9,
    },
    hyphen: {
        format: (score) => score.toString(),
        order: 10,
    },
} satisfies Record<
    BirdBotRecordType,
    {
        format: (arg0: number) => string;
        order: number;
    }
>;
