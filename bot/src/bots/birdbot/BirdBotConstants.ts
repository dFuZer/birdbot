import { z } from "zod";
import Utilitary from "../../lib/class/Utilitary.class";
import { DictionaryId, DictionaryLessGameRules } from "../../lib/types/gameTypes";
import { BirdBotGameMode, BirdBotLanguage, BirdBotRecordType, BirdBotSupportedDictionaryId } from "./BirdBotTypes";

export const DISCORD_SERVER_LINK = "https://discord.com/invite/J3yHjv4ZUd";
export const GITHUB_REPO_LINK = "https://github.com/dFuZer/birdbot";
export const PAYPAL_DONATE_LINK = "https://www.paypal.com/paypalme/enzotomassi";
export const WEBSITE_LINK = "https://birdbot.gg";

const birdbotRulesBase: Omit<
    DictionaryLessGameRules,
    "bombDuration" | "customPromptDifficulty" | "maxLives" | "startingLives"
> = {
    roundsToWin: 1,
    scoreGoal: 100,
    gameMode: "survival",
    minWordLengthOption: "0",
    promptDifficulty: "custom",
};

const birdbotRegularModeRules: DictionaryLessGameRules = {
    ...birdbotRulesBase,
    bombDuration: 5,
    customPromptDifficulty: 1,
    maxLives: 3,
    startingLives: 2,
};

const birdbotEasyModeRules: DictionaryLessGameRules = {
    ...birdbotRulesBase,
    bombDuration: 7,
    customPromptDifficulty: 400,
    maxLives: 3,
    startingLives: 3,
};

const birdbotBlitzModeRules: DictionaryLessGameRules = {
    ...birdbotRulesBase,
    bombDuration: 3,
    customPromptDifficulty: 1,
    maxLives: 2,
    startingLives: 3,
};

const birdbotSub500ModeRules: DictionaryLessGameRules = {
    ...birdbotRulesBase,
    bombDuration: 5,
    customPromptDifficulty: -500,
    maxLives: 3,
    startingLives: 2,
};

const birdbotSub50ModeRules: DictionaryLessGameRules = {
    ...birdbotRulesBase,
    bombDuration: 5,
    customPromptDifficulty: -50,
    maxLives: 3,
    startingLives: 2,
};

const birdbotFreeplayModeRules: DictionaryLessGameRules = {
    ...birdbotRulesBase,
    bombDuration: 10,
    customPromptDifficulty: 1,
    maxLives: 10,
    startingLives: 10,
};

export const defaultBirdBotBombPartyRules: DictionaryLessGameRules = birdbotRegularModeRules;

export const birdbotModeRules: Record<BirdBotGameMode, DictionaryLessGameRules> = {
    regular: birdbotRegularModeRules,
    easy: birdbotEasyModeRules,
    blitz: birdbotBlitzModeRules,
    sub500: birdbotSub500ModeRules,
    sub50: birdbotSub50ModeRules,
    freeplay: birdbotFreeplayModeRules,
};

export const birdbotLanguageToDictionaryId: Record<BirdBotLanguage, DictionaryId> = {
    fr: "fr",
    en: "en",
    de: "de",
    es: "es",
    brpt: "pt-BR",
    it: "it",
};

export const dictionaryIdToBirdbotLanguage: Record<BirdBotSupportedDictionaryId, BirdBotLanguage> = {
    "fr": "fr",
    "en": "en",
    "de": "de",
    "es": "es",
    "pt-BR": "brpt",
    "it": "it",
};

export const birdbotSupportedDictionaryIds = ["fr", "en", "de", "es", "pt-BR", "it"] as const;

export const languageEnumSchema = z.enum(["fr", "en", "de", "es", "brpt", "it"]);
export const modesEnumSchema = z.enum(["regular", "easy", "blitz", "sub500", "sub50", "freeplay"]);
export const recordsEnumSchema = z.enum([
    "word",
    "time",
    "multi_syllable",
    "previous_syllable",
    "flips",
    "depleted_syllables",
    "no_death",
    "alpha",
    "hyphen",
    "more_than_20_letters",
]);

export const defaultLanguage: BirdBotLanguage = "en";
export const defaultMode: BirdBotGameMode = "regular";

export const languageFlagMap: Record<BirdBotLanguage, string> = {
    fr: "🇫🇷",
    en: "🇺🇸",
    de: "🇩🇪",
    es: "🇪🇸",
    brpt: "🇧🇷",
    it: "🇮🇹",
};

export const languageDisplayStrings: Record<BirdBotLanguage, string> = {
    fr: "French",
    en: "English",
    de: "German",
    es: "Spanish",
    brpt: "Brazilian Portuguese",
    it: "Italian",
};

export const languageAliases: Record<BirdBotLanguage, string[]> = {
    fr: ["french", "fr", "francais", "français"],
    en: ["english", "en", "anglais", "anglais", "eng", "englais" /*  ça arrive plus souvent que ce qu'on croit */],
    de: ["german", "de", "deutsch", "deutsch", "allemand", "ger"],
    es: ["spanish", "es", "español", "español", "espagnol", "esp"],
    brpt: ["brasileiro", "brpt", "portuguese", "portugais", "br", "pt", "portugais"],
    it: ["italian", "it", "italiano", "italiano", "italien", "it"],
};

export const recordAliases: Record<BirdBotRecordType, string[]> = {
    word: ["words", "word", "mots", "mot", "mots", "w", "m"],
    time: ["time", "temps", "temp", "t"],
    multi_syllable: ["multi-syllable", "multi-syllables", "ms", "multi", "m"],
    previous_syllable: ["previous-syllable", "previous-syllables", "previous", "prev", "ps", "p"],
    flips: ["flips", "flip", "life", "lives", "vie", "vies", "v"],
    depleted_syllables: ["depleted-syllables", "syllables-depleted", "depleted", "syll", "sn"],
    no_death: ["no-death", "nd", "sans-mort", "sm", "nodeath"],
    alpha: ["alpha", "alp", "a"],
    hyphen: ["hyphen", "hyp", "hyph", "compose", "mot-compose", "mot-composes", "h"],
    more_than_20_letters: [
        "more-than-20-letters",
        "20+",
        "plus-de-20-lettres",
        "long",
        "longs",
        "20-letters",
        "20",
        "l",
    ],
};

export const sortWordsModeRecords = ["flips", "multi_syllable", "depleted_syllables"] as const;
export const filterWordsModeRecords = ["hyphen", "more_than_20_letters"] as const;

export const modeDisplayStrings: Record<BirdBotGameMode, string> = {
    regular: "Regular",
    easy: "Easy",
    blitz: "Blitz",
    sub500: "Sub500",
    sub50: "Sub50",
    freeplay: "Freeplay",
};

export const recordsUtils: Record<
    BirdBotRecordType,
    {
        recordDisplayString: string;
        scoreDisplayStringGenerator: (score: number) => string;
        specificScoreDisplayStringGenerator: (score: number) => string;
        order: number;
    }
> = {
    word: {
        recordDisplayString: "Words",
        scoreDisplayStringGenerator: (score) => `${score} words`,
        specificScoreDisplayStringGenerator: (score) => `${score} words`,
        order: 1,
    },
    time: {
        recordDisplayString: "Time",
        scoreDisplayStringGenerator: Utilitary.formatTime,
        specificScoreDisplayStringGenerator: Utilitary.formatTime,
        order: 2,
    },
    flips: {
        recordDisplayString: "Flips",
        scoreDisplayStringGenerator: (score) => `${score} flips`,
        specificScoreDisplayStringGenerator: (score) => `${score} flips`,
        order: 3,
    },
    depleted_syllables: {
        recordDisplayString: "Depleted syllables",
        scoreDisplayStringGenerator: (score) => `${score} SN`,
        specificScoreDisplayStringGenerator: (score) => `${score} SN`,
        order: 4,
    },
    alpha: {
        recordDisplayString: "Alpha",
        scoreDisplayStringGenerator: Utilitary.displayAlphaScore,
        specificScoreDisplayStringGenerator: Utilitary.displayAlphaScore,
        order: 5,
    },
    no_death: {
        recordDisplayString: "No death",
        scoreDisplayStringGenerator: (score) => `${score} words`,
        specificScoreDisplayStringGenerator: (score) => `${score} words without death`,
        order: 6,
    },
    multi_syllable: {
        recordDisplayString: "Multi-syllable",
        scoreDisplayStringGenerator: (score) => `${score} MS`,
        specificScoreDisplayStringGenerator: (score) => `${score} MS`,
        order: 7,
    },
    previous_syllable: {
        recordDisplayString: "Previous syllable",
        scoreDisplayStringGenerator: (score) => `${score} PS`,
        specificScoreDisplayStringGenerator: (score) => `${score} PS`,
        order: 8,
    },
    more_than_20_letters: {
        recordDisplayString: "Long words",
        scoreDisplayStringGenerator: (score) => `${score} words`,
        specificScoreDisplayStringGenerator: (score) => `${score} long words`,
        order: 9,
    },
    hyphen: {
        recordDisplayString: "Hyphen",
        scoreDisplayStringGenerator: (score) => `${score} words`,
        specificScoreDisplayStringGenerator: (score) => `${score} hyphens`,
        order: 10,
    },
};
