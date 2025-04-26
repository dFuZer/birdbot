import { z } from "zod";
import Utilitary from "../../lib/class/Utilitary.class";
import type { BombPartyRules, DictionaryId } from "../../lib/types/gameTypes";
import type { BirdBotGameMode, BirdBotLanguage, BirdBotRecordType } from "./BirdBotResources";

export const defaultBirdBotBombPartyRules: Partial<BombPartyRules> = {
    promptDifficulty: "custom",
    bombDuration: 5,
    customPromptDifficulty: 1,
    roundsToWin: 1,
    minWordLengthOption: "0",
    maxLives: 3,
    startingLives: 2,
    scoreGoal: 100,
};

export const languageConversionMap: Partial<Record<DictionaryId, BirdBotLanguage>> = {
    "fr": "fr",
    "en": "en",
    "de": "de",
    "es": "es",
    "pt-BR": "brpt",
};

export const languageEnumSchema = z.enum(["fr", "en", "de", "es", "brpt"]);
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
};

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
        recordDisplayString: "20+",
        scoreDisplayStringGenerator: (score) => `${score} words`,
        specificScoreDisplayStringGenerator: (score) => `${score} 20+`,
        order: 9,
    },
    hyphen: {
        recordDisplayString: "Hyphen",
        scoreDisplayStringGenerator: (score) => `${score} words`,
        specificScoreDisplayStringGenerator: (score) => `${score} hyphens`,
        order: 10,
    },
};
