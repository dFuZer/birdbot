import { z } from "zod";
import { languageEnumSchema, modeEnumSchema, recordsEnumSchema } from "./records.zod";

const actor = z.string().trim().min(1).max(80);
const idempotencyKey = z.string().trim().min(8).max(120);
const metadata = z.record(z.unknown()).default({});
const playerParams = z.object({ playerId: z.string().uuid() });

const creditMutationSchema = z.object({
    playerId: z.string().uuid(),
    amount: z.number().int().refine((value) => value !== 0),
    reason: z.string().trim().min(1).max(120),
    reference: z.string().trim().max(160).optional(),
    idempotencyKey,
    actor,
    metadata,
});

const xpMutationSchema = z.object({
    playerId: z.string().uuid(),
    operation: z.enum(["ADD", "SET"]),
    amount: z.number().int().min(-2_000_000_000).max(2_000_000_000),
    reason: z.string().trim().min(1).max(120),
    idempotencyKey,
    actor,
    metadata,
});

const purchaseSchema = z.object({
    playerId: z.string().uuid(),
    sku: z.string().trim().min(1).max(120),
    creditsSpent: z.number().int().nonnegative(),
    externalReference: z.string().trim().min(1).max(160).optional(),
    idempotencyKey,
    actor,
    metadata,
});

const cosmeticsSchema = z
    .object({
        welcomeMessage: z.string().trim().max(500).nullable().optional(),
        roomName: z.string().trim().max(100).nullable().optional(),
        botName: z.string().trim().max(80).nullable().optional(),
        // Raw JKLM avatar payload (usually base64), not necessarily a URL.
        pictureUrl: z.string().min(1).max(500_000).nullable().optional(),
        updatedBy: actor,
    })
    .refine(
        (value) =>
            value.welcomeMessage !== undefined ||
            value.roomName !== undefined ||
            value.botName !== undefined ||
            value.pictureUrl !== undefined,
        "At least one cosmetic field is required",
    );

const profileNameSchema = z.object({
    username: z.string().trim().min(2).max(20),
    updatedBy: actor,
});

const vipSchema = z.object({
    tier: z.enum(["NONE", "VIP", "VIP_PLUS"]),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    grantedBy: actor,
    reason: z.string().trim().max(240).nullable().optional(),
    idempotencyKey,
});

const milestoneSchema = z.object({
    playerId: z.string().uuid(),
    type: z.enum(["SPEED", "ACCURACY"]),
    language: languageEnumSchema,
    mode: modeEnumSchema,
    category: recordsEnumSchema,
    milestone: z.number().int().positive(),
    value: z.number().finite().nonnegative(),
    achievedAt: z.string().datetime().optional(),
    source: z.string().trim().max(80).optional(),
    idempotencyKey,
    metadata,
});

const milestoneQuerySchema = z.object({
    type: z.enum(["SPEED", "ACCURACY"]),
    language: languageEnumSchema,
    mode: modeEnumSchema,
    category: recordsEnumSchema.optional(),
    milestone: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const moderationSchema = z
    .object({
        trustScore: z.number().int().min(-100).max(100).optional(),
        blacklisted: z.boolean().optional(),
        blacklistReason: z.string().trim().max(500).nullable().optional(),
        suppressed: z.boolean().optional(),
        suppressReason: z.string().trim().max(500).nullable().optional(),
        updatedBy: actor,
    })
    .refine(
        (value) =>
            value.trustScore !== undefined || value.blacklisted !== undefined || value.suppressed !== undefined,
        "No state change supplied",
    );

const newsQuerySchema = z.object({
    includeDrafts: z.enum(["true", "false"]).transform((value) => value === "true").default("false"),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const newsCreateSchema = z.object({
    title: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(20_000),
    published: z.boolean().default(false),
    publishedAt: z.string().datetime().nullable().optional(),
    actor,
    idempotencyKey,
});

const newsUpdateSchema = z
    .object({
        title: z.string().trim().min(1).max(160).optional(),
        body: z.string().trim().min(1).max(20_000).optional(),
        published: z.boolean().optional(),
        publishedAt: z.string().datetime().nullable().optional(),
        actor,
    })
    .refine(
        (value) =>
            value.title !== undefined ||
            value.body !== undefined ||
            value.published !== undefined ||
            value.publishedAt !== undefined,
        "No news change supplied",
    );

export {
    cosmeticsSchema,
    creditMutationSchema,
    milestoneQuerySchema,
    milestoneSchema,
    moderationSchema,
    newsCreateSchema,
    newsQuerySchema,
    newsUpdateSchema,
    playerParams,
    profileNameSchema,
    purchaseSchema,
    vipSchema,
    xpMutationSchema,
};
