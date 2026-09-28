import { createHash } from "crypto";
import type { TLanguage } from "../schemas/records.zod";

export const WEEKLY_CHALLENGE_CONFIG_VERSION = 1;
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
/** Number of future weeks kept generated ahead of the current one. */
export const WEEKLY_CHALLENGE_HORIZON_WEEKS = 8;

export const WEEKLY_CHALLENGE_ROTATION = [
    "THIRTY_OF_A_LETTER",
    "PROMPT_MEMORY_SPRINT",
    "ALPHA_SPRINT",
    "FIVEFOLD_ALPHABET",
    "BLITZ_SURVIVAL",
    "SUB50_SURVIVAL",
    "SUB500_LIFE_GAIN",
] as const;
export type WeeklyChallengeKind = (typeof WEEKLY_CHALLENGE_ROTATION)[number];

const LANGUAGES: TLanguage[] = ["fr", "en", "de", "es", "brpt", "it"];
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

const dictionaryIdByLanguage: Record<TLanguage, string> = {
    fr: "fr",
    en: "en",
    de: "de",
    es: "es",
    brpt: "pt-BR",
    it: "it",
};

/** Letters disabled by default in each language's bonus alphabet (BBV7 defaults; everything else is 1). */
const disabledDefaultLettersByLanguage: Record<TLanguage, string> = {
    en: "xz",
    fr: "kwxyz",
    es: "kwxyz",
    de: "jqxy",
    it: "jkwxy",
    brpt: "kwxyz",
};

/**
 * Three rarest a–z letters per dictionary, rarest first.
 * Counted from bot/resources/dictionaries on 2026-09-27.
 * A letter must occur more than 250 times. Letters under 2,000 are preferred.
 * Letters at 5,000 or more are only used when a language has fewer than three below that.
 * BRPT has no letter between 250 and 5,000 (k is 82, x is 12,518), so its pool is the next three.
 */
export const THIRTY_OF_A_LETTER_POOLS: Record<TLanguage, string[]> = {
    en: ["q", "j", "x"],
    fr: ["w", "k", "j"],
    de: ["q", "j", "x"],
    es: ["w", "k", "y"],
    brpt: ["x", "q", "j"],
    it: ["j", "w", "x"],
};

export type ChallengeBonusAlphabet = Record<string, number>;

export type ChallengeRules = {
    dictionaryId: string;
    minTurnDuration: number;
    promptDifficulty: "custom";
    customPromptDifficulty: number;
    maxPromptAge: number;
    startingLives: number;
    maxLives: number;
    customBonusAlphabet: ChallengeBonusAlphabet;
};

export type RankingMetric = "elapsed_ms" | "words" | "flips";
export type RankingKey = { metric: RankingMetric; order: "asc" | "desc" };

export type WeeklyChallengeConfig = {
    version: number;
    kind: WeeklyChallengeKind;
    /** The ordinary mode these rules match, or "custom" when they only count for the challenge. */
    baseMode: "custom" | "blitz" | "sub50" | "sub500";
    objective: { type: "bonus_alphabet" | "prompt_memory" | "alpha" | "survival"; target: number | null };
    ranking: { primary: RankingKey; secondary: RankingKey | null };
    languages: Record<TLanguage, { rules: ChallengeRules; fingerprint: string; targetLetter: string | null }>;
};

type DictionaryLessRules = Omit<ChallengeRules, "dictionaryId" | "customBonusAlphabet">;

const regularRules: DictionaryLessRules = {
    minTurnDuration: 5,
    promptDifficulty: "custom",
    customPromptDifficulty: 1,
    maxPromptAge: 16,
    startingLives: 2,
    maxLives: 3,
};
const blitzRules: DictionaryLessRules = { ...regularRules, minTurnDuration: 2 };
const sub50Rules: DictionaryLessRules = { ...regularRules, customPromptDifficulty: -50 };
const sub500Rules: DictionaryLessRules = { ...regularRules, customPromptDifficulty: -500 };

function uniformAlphabet(count: number): ChallengeBonusAlphabet {
    const alphabet: ChallengeBonusAlphabet = {};
    for (const letter of ALPHABET) alphabet[letter] = count;
    return alphabet;
}

export function defaultBonusAlphabet(language: TLanguage): ChallengeBonusAlphabet {
    const alphabet: ChallengeBonusAlphabet = {};
    for (const letter of ALPHABET) {
        alphabet[letter] = disabledDefaultLettersByLanguage[language].includes(letter) ? 0 : 1;
    }
    return alphabet;
}

export function startOfUtcWeek(date: Date): Date {
    const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const daysSinceMonday = (new Date(dayStart).getUTCDay() + 6) % 7;
    return new Date(dayStart - daysSinceMonday * 24 * 60 * 60 * 1000);
}

export function kindForSequence(sequence: number): WeeklyChallengeKind {
    return WEEKLY_CHALLENGE_ROTATION[sequence % WEEKLY_CHALLENGE_ROTATION.length]!;
}

/** Each appearance of Thirty of a Letter uses the next letter of the language pool. */
export function thirtyOfALetterTarget(language: TLanguage, sequence: number): string {
    const pool = THIRTY_OF_A_LETTER_POOLS[language];
    const occurrence = Math.floor(sequence / WEEKLY_CHALLENGE_ROTATION.length);
    return pool[occurrence % pool.length]!;
}

/** Must stay identical to the bot's `weeklyChallengeRulesFingerprint`. */
export function rulesFingerprint(rules: ChallengeRules): string {
    const alphabet = [...ALPHABET].map((letter) => rules.customBonusAlphabet[letter] ?? 0).join(",");
    const canonical = [
        rules.dictionaryId,
        rules.minTurnDuration,
        rules.promptDifficulty,
        rules.customPromptDifficulty,
        rules.maxPromptAge,
        rules.startingLives,
        rules.maxLives,
        alphabet,
    ].join("|");
    return createHash("sha256").update(canonical).digest("hex");
}

function rulesFor(kind: WeeklyChallengeKind, language: TLanguage, sequence: number) {
    const dictionaryId = dictionaryIdByLanguage[language];
    switch (kind) {
        case "THIRTY_OF_A_LETTER": {
            const targetLetter = thirtyOfALetterTarget(language, sequence);
            const customBonusAlphabet = uniformAlphabet(0);
            customBonusAlphabet[targetLetter] = 30;
            return {
                targetLetter,
                rules: { ...regularRules, startingLives: 3, dictionaryId, customBonusAlphabet },
            };
        }
        case "PROMPT_MEMORY_SPRINT":
            return {
                targetLetter: null,
                rules: {
                    ...regularRules,
                    minTurnDuration: 7,
                    customPromptDifficulty: 300,
                    dictionaryId,
                    customBonusAlphabet: defaultBonusAlphabet(language),
                },
            };
        case "ALPHA_SPRINT":
            return { targetLetter: null, rules: { ...regularRules, dictionaryId, customBonusAlphabet: uniformAlphabet(2) } };
        case "FIVEFOLD_ALPHABET":
            return { targetLetter: null, rules: { ...regularRules, dictionaryId, customBonusAlphabet: uniformAlphabet(5) } };
        case "BLITZ_SURVIVAL":
            return { targetLetter: null, rules: { ...blitzRules, dictionaryId, customBonusAlphabet: defaultBonusAlphabet(language) } };
        case "SUB50_SURVIVAL":
            return { targetLetter: null, rules: { ...sub50Rules, dictionaryId, customBonusAlphabet: defaultBonusAlphabet(language) } };
        case "SUB500_LIFE_GAIN":
            return { targetLetter: null, rules: { ...sub500Rules, dictionaryId, customBonusAlphabet: defaultBonusAlphabet(language) } };
    }
}

const elapsedAsc: RankingKey = { metric: "elapsed_ms", order: "asc" };

const objectiveByKind: Record<
    WeeklyChallengeKind,
    Pick<WeeklyChallengeConfig, "baseMode" | "objective" | "ranking">
> = {
    THIRTY_OF_A_LETTER: {
        baseMode: "custom",
        objective: { type: "bonus_alphabet", target: null },
        ranking: { primary: elapsedAsc, secondary: null },
    },
    PROMPT_MEMORY_SPRINT: {
        baseMode: "custom",
        objective: { type: "prompt_memory", target: 4 },
        ranking: { primary: elapsedAsc, secondary: null },
    },
    ALPHA_SPRINT: {
        baseMode: "custom",
        objective: { type: "alpha", target: 5 },
        ranking: { primary: elapsedAsc, secondary: null },
    },
    FIVEFOLD_ALPHABET: {
        baseMode: "custom",
        objective: { type: "bonus_alphabet", target: null },
        ranking: { primary: { metric: "words", order: "asc" }, secondary: elapsedAsc },
    },
    BLITZ_SURVIVAL: {
        baseMode: "blitz",
        objective: { type: "survival", target: null },
        ranking: { primary: { metric: "words", order: "desc" }, secondary: null },
    },
    SUB50_SURVIVAL: {
        baseMode: "sub50",
        objective: { type: "survival", target: null },
        ranking: { primary: { metric: "words", order: "desc" }, secondary: null },
    },
    SUB500_LIFE_GAIN: {
        baseMode: "sub500",
        objective: { type: "survival", target: null },
        ranking: { primary: { metric: "flips", order: "desc" }, secondary: null },
    },
};

export function buildWeeklyChallengeConfig(sequence: number): WeeklyChallengeConfig {
    const kind = kindForSequence(sequence);
    const languages = {} as WeeklyChallengeConfig["languages"];
    for (const language of LANGUAGES) {
        const { rules, targetLetter } = rulesFor(kind, language, sequence);
        languages[language] = { rules, targetLetter, fingerprint: rulesFingerprint(rules) };
    }
    return { version: WEEKLY_CHALLENGE_CONFIG_VERSION, kind, ...objectiveByKind[kind], languages };
}

/** True when `candidate` ranks strictly better than `current` under `ranking`. */
export function isBetterResult(
    ranking: WeeklyChallengeConfig["ranking"],
    candidate: { primary: number; secondary: number | null },
    current: { primary: number; secondary: number | null },
): boolean {
    if (candidate.primary !== current.primary) {
        return ranking.primary.order === "asc" ? candidate.primary < current.primary : candidate.primary > current.primary;
    }
    if (!ranking.secondary || candidate.secondary === null || current.secondary === null) return false;
    return ranking.secondary.order === "asc"
        ? candidate.secondary < current.secondary
        : candidate.secondary > current.secondary;
}
