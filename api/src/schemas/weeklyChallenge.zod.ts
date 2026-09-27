import { z } from "zod";
import { numericString } from "./common.zod";
import { playerSchema } from "./player.zod";
import { languageEnumSchema } from "./records.zod";

const nonNegativeInt = z.number().int().min(0).max(2_147_483_647);

const submitWeeklyChallengeResultSchema = z.object({
    periodId: z.string().uuid(),
    configVersion: z.number().int().min(1),
    language: languageEnumSchema,
    rulesFingerprint: z.string().regex(/^[0-9a-f]{64}$/),
    player: playerSchema,
    gameId: z.string().uuid(),
    primaryValue: nonNegativeInt,
    secondaryValue: nonNegativeInt.nullable().default(null),
    elapsedMs: nonNegativeInt,
    wordsCount: nonNegativeInt,
    achievedAt: z.number().int().positive(),
});

const weeklyChallengePeriodsQuerySchema = z.object({
    page: numericString.pipe(z.number().int().min(1)).default("1"),
    perPage: numericString.pipe(z.number().int().min(1).max(100)).default("20"),
});

const weeklyChallengeLeaderboardQuerySchema = weeklyChallengePeriodsQuerySchema.extend({
    lang: languageEnumSchema,
    perPage: numericString.pipe(z.number().int().min(1).max(100)).default("50"),
});

const weeklyChallengePeriodParamsSchema = z.object({ periodId: z.string().uuid() });

type TSubmitWeeklyChallengeResult = z.infer<typeof submitWeeklyChallengeResultSchema>;

export {
    submitWeeklyChallengeResultSchema,
    weeklyChallengeLeaderboardQuerySchema,
    weeklyChallengePeriodParamsSchema,
    weeklyChallengePeriodsQuerySchema,
    type TSubmitWeeklyChallengeResult,
};
