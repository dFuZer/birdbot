import { createHash } from "crypto";
import { z } from "zod";
import { alphabet } from "../../lib/constants/gameConstants";
import type { BombPartyRules } from "../../lib/types/gameTypes";
import { languageEnumSchema } from "./BirdBotConstants";
import type { BirdBotLanguage } from "./BirdBotTypes";

export const WEEKLY_CHALLENGE_LEADERBOARD_URL = "https://birdbot.dev/cotw";

const rankingKeySchema = z.object({
    metric: z.enum(["elapsed_ms", "words", "flips"]),
    order: z.enum(["asc", "desc"]),
});

const challengeRulesSchema = z.object({
    dictionaryId: z.string(),
    minTurnDuration: z.number(),
    promptDifficulty: z.literal("custom"),
    customPromptDifficulty: z.number(),
    maxPromptAge: z.number(),
    startingLives: z.number(),
    maxLives: z.number(),
    customBonusAlphabet: z.record(z.number()),
});

export const weeklyChallengeKindSchema = z.enum([
    "THIRTY_OF_A_LETTER",
    "PROMPT_MEMORY_SPRINT",
    "ALPHA_SPRINT",
    "FIVEFOLD_ALPHABET",
    "BLITZ_SURVIVAL",
    "SUB50_SURVIVAL",
    "SUB500_LIFE_GAIN",
]);

export const weeklyChallengeConfigSchema = z.object({
    version: z.number().int(),
    kind: weeklyChallengeKindSchema,
    baseMode: z.enum(["custom", "blitz", "sub50", "sub500"]),
    objective: z.object({
        type: z.enum(["bonus_alphabet", "prompt_memory", "alpha", "survival"]),
        target: z.number().int().nullable(),
    }),
    ranking: z.object({ primary: rankingKeySchema, secondary: rankingKeySchema.nullable() }),
    languages: z.record(
        languageEnumSchema,
        z.object({ rules: challengeRulesSchema, fingerprint: z.string(), targetLetter: z.string().nullable() }),
    ),
});

export const weeklyChallengePeriodSchema = z.object({
    id: z.string().uuid(),
    sequence: z.number().int(),
    kind: weeklyChallengeKindSchema,
    startsAt: z.number(),
    endsAt: z.number(),
    configVersion: z.number().int(),
    config: weeklyChallengeConfigSchema,
});

export type WeeklyChallengeKind = z.infer<typeof weeklyChallengeKindSchema>;
export type WeeklyChallengeConfig = z.infer<typeof weeklyChallengeConfigSchema>;
export type WeeklyChallengePeriod = z.infer<typeof weeklyChallengePeriodSchema>;
export type WeeklyChallengeRules = z.infer<typeof challengeRulesSchema>;
export type WeeklyChallengeMetrics = { elapsed_ms: number; words: number; flips: number };

/** Must stay identical to the API's `rulesFingerprint` (api/src/helpers/weeklyChallenges.ts). */
export function weeklyChallengeRulesFingerprint(rules: Omit<BombPartyRules, "dictionaryId"> & { dictionaryId: string }): string {
    const letters = [...alphabet].map((letter) => rules.customBonusAlphabet?.[letter] ?? 0).join(",");
    const canonical = [
        rules.dictionaryId,
        rules.minTurnDuration,
        rules.promptDifficulty,
        rules.customPromptDifficulty,
        rules.maxPromptAge,
        rules.startingLives,
        rules.maxLives,
        letters,
    ].join("|");
    return createHash("sha256").update(canonical).digest("hex");
}

/** At rollover the next cached period takes over immediately, without waiting for a refresh. */
export function selectActiveWeeklyChallenge(
    current: WeeklyChallengePeriod | null,
    next: WeeklyChallengePeriod | null,
    now: number,
): WeeklyChallengePeriod | null {
    for (const period of [current, next]) {
        if (period && period.startsAt <= now && now < period.endsAt) return period;
    }
    return null;
}

export function matchWeeklyChallenge(
    period: WeeklyChallengePeriod | null,
    language: BirdBotLanguage | undefined,
    rules: Parameters<typeof weeklyChallengeRulesFingerprint>[0],
): boolean {
    if (!period || !language) return false;
    const languageConfig = period.config.languages[language];
    return Boolean(languageConfig && languageConfig.fingerprint === weeklyChallengeRulesFingerprint(rules));
}

/** Sprint and efficiency objectives complete mid-round; survival objectives only finalize at death. */
export function isInstantObjectiveReached(
    objective: WeeklyChallengeConfig["objective"],
    event: { type: "flip" } | { type: "word"; promptMemoryChain: number; alpha: number },
): boolean {
    switch (objective.type) {
        case "bonus_alphabet":
            return event.type === "flip";
        case "prompt_memory":
            return event.type === "word" && event.promptMemoryChain >= (objective.target ?? Infinity);
        case "alpha":
            return event.type === "word" && event.alpha >= (objective.target ?? Infinity);
        case "survival":
            return false;
    }
}

export function weeklyChallengeResultValues(
    ranking: WeeklyChallengeConfig["ranking"],
    metrics: WeeklyChallengeMetrics,
): { primaryValue: number; secondaryValue: number | null } {
    return {
        primaryValue: metrics[ranking.primary.metric],
        secondaryValue: ranking.secondary ? metrics[ranking.secondary.metric] : null,
    };
}
