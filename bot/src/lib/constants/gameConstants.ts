import type { BombPartyRules, DictionaryId, DictionaryManifest } from "../types/gameTypes";

export const jklmDomain = "jklm.fun";

export const dictionaryIds = ["en", "fr", "de", "it", "es", "pt-BR", "eu", "br", "nah"] as const;

export const dictionaryManifests: Record<DictionaryId, DictionaryManifest> = {
    fr: {
        name: "French",
        bonusLetters: "abcdefghijklmnopqrstuvxyz",
        promptDifficulties: { beginner: 500, medium: 300, hard: 100 },
    },
    br: {
        name: "Breton",
        bonusLetters: "abcdefghijklmnopqrstuvxyz",
        promptDifficulties: { beginner: 500, medium: 300, hard: 100 },
    },
    en: {
        name: "English",
        bonusLetters: "abcdefghijklmnopqrstuvwy",
        promptDifficulties: { beginner: 500, medium: 300, hard: 100 },
    },
    de: {
        name: "German",
        bonusLetters: "abcdefghijklmnopqrstuvwy",
        promptDifficulties: { beginner: 500, medium: 300, hard: 100 },
    },
    "pt-BR": {
        name: "Brazilian Portuguese",
        bonusLetters: "abcdefghijlmnopqrstuvxz",
        promptDifficulties: { beginner: 500, medium: 300, hard: 100 },
    },
    es: {
        name: "Spanish",
        bonusLetters: "abcdefghijlmnopqrstuvxyz",
        promptDifficulties: { beginner: 500, medium: 300, hard: 100 },
    },
    it: {
        name: "Italian",
        bonusLetters: "abcdefghilmnopqrstuz",
        promptDifficulties: { beginner: 500, medium: 300, hard: 100 },
    },
    eu: {
        name: "Basque",
        bonusLetters: "abdefghijklmnoprstuxz",
        promptDifficulties: { beginner: 500, medium: 300, hard: 100 },
    },
    nah: {
        name: "Nahuatl",
        bonusLetters: "abcdefghijklmnopqrstuvwxyz",
        promptDifficulties: { beginner: 500, medium: 300, hard: 100 },
    },
};

export const defaultBombPartyRules: BombPartyRules = {
    dictionaryId: "en",
    minTurnDuration: 5,
    promptDifficulty: "beginner",
    customPromptDifficulty: 500,
    maxPromptAge: 2,
    startingLives: 2,
    maxLives: 3,
};

export const promptDifficulties = ["beginner", "medium", "hard", "custom"] as const;
export const alphabet = "abcdefghijklmnopqrstuvwxyz" as const;
export const submitResults = ["success", "failsPrompt", "invalidWord", "noText", "alreadyUsed", "bombExploded"] as const;

export const failWordReasons = ["notInDictionary", "alreadyUsed", "wrongPrompt", "tooShort"] as const;
