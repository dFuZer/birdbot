import { Prisma, type MilestoneType, type VipTier } from "@prisma/client";
import { languageEnumToDatabaseEnumMap, modeEnumToDatabaseEnumMap } from "../helpers/maps";
import type { TLanguage, TMode, TRecord } from "../schemas/records.zod";
import prisma from "../prisma";

type JsonMetadata = Record<string, unknown>;

const asJson = (value: JsonMetadata): Prisma.InputJsonObject => value as Prisma.InputJsonObject;

class InsufficientCreditsError extends Error {}
class InvalidPurchaseError extends Error {}
class InvalidXpMutationError extends Error {}
class ProfileNameConflictError extends Error {}
class ProfileNameCooldownError extends Error {
    constructor(public readonly availableAt: Date) {
        super("Profile name can only be changed once every 30 days");
    }
}

async function getEconomyProfile(playerId: string) {
    const now = new Date();
    const [account, cosmetics, vip, purchases] = await Promise.all([
        prisma.creditAccount.findUnique({ where: { player_id: playerId } }),
        prisma.playerCosmetics.findUnique({ where: { player_id: playerId } }),
        prisma.vipEntitlement.findFirst({
            where: {
                player_id: playerId,
                starts_at: { lte: now },
                OR: [{ expires_at: null }, { expires_at: { gt: now } }],
            },
            orderBy: [{ starts_at: "desc" }, { updated_at: "desc" }],
        }),
        prisma.purchase.findMany({
            where: { player_id: playerId },
            orderBy: { purchased_at: "desc" },
            take: 50,
        }),
    ]);
    return { balance: account?.balance ?? 0, cosmetics, vip, purchases };
}

type CreditMutation = {
    playerId: string;
    amount: number;
    reason: string;
    reference?: string;
    idempotencyKey: string;
    actor: string;
    metadata: JsonMetadata;
};

async function mutateCredits(input: CreditMutation) {
    const existing = await prisma.creditLedger.findUnique({ where: { idempotency_key: input.idempotencyKey } });
    if (existing) return existing;

    try {
        return await prisma.$transaction(async (tx) => {
            await tx.creditAccount.upsert({
                where: { player_id: input.playerId },
                create: { player_id: input.playerId },
                update: {},
            });
            const changed = await tx.creditAccount.updateMany({
                where: {
                    player_id: input.playerId,
                    ...(input.amount < 0 ? { balance: { gte: -input.amount } } : {}),
                },
                data: { balance: { increment: input.amount } },
            });
            if (changed.count !== 1) throw new InsufficientCreditsError("Insufficient credits");
            const account = await tx.creditAccount.findUniqueOrThrow({ where: { player_id: input.playerId } });
            return tx.creditLedger.create({
                data: {
                    player_id: input.playerId,
                    amount: input.amount,
                    balance_after: account.balance,
                    reason: input.reason,
                    reference: input.reference,
                    idempotency_key: input.idempotencyKey,
                    actor: input.actor,
                    metadata: asJson(input.metadata),
                },
            });
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return prisma.creditLedger.findUniqueOrThrow({ where: { idempotency_key: input.idempotencyKey } });
        }
        throw error;
    }
}

type PurchaseInput = {
    playerId: string;
    sku: string;
    creditsSpent: number;
    externalReference?: string;
    idempotencyKey: string;
    actor: string;
    metadata: JsonMetadata;
};

async function recordPurchase(input: PurchaseInput) {
    const catalog = { VIP: 500 } as const;
    const expectedPrice = catalog[input.sku as keyof typeof catalog];
    if (expectedPrice === undefined || input.creditsSpent !== expectedPrice) {
        throw new InvalidPurchaseError("Unknown SKU or invalid price");
    }
    const existing = await prisma.purchase.findFirst({
        where: {
            OR: [
                { idempotency_key: input.idempotencyKey },
                ...(input.externalReference ? [{ external_reference: input.externalReference }] : []),
            ],
        },
    });
    if (existing) return existing;

    try {
        return await prisma.$transaction(async (tx) => {
            await tx.creditAccount.upsert({
                where: { player_id: input.playerId },
                create: { player_id: input.playerId },
                update: {},
            });
            const changed = await tx.creditAccount.updateMany({
                where: { player_id: input.playerId, balance: { gte: input.creditsSpent } },
                data: { balance: { decrement: input.creditsSpent } },
            });
            if (changed.count !== 1) throw new InsufficientCreditsError("Insufficient credits");
            const account = await tx.creditAccount.findUniqueOrThrow({ where: { player_id: input.playerId } });
            const purchase = await tx.purchase.create({
                data: {
                    player_id: input.playerId,
                    sku: input.sku,
                    credits_spent: input.creditsSpent,
                    external_reference: input.externalReference,
                    idempotency_key: input.idempotencyKey,
                    actor: input.actor,
                    metadata: asJson(input.metadata),
                },
            });
            if (input.creditsSpent > 0) {
                await tx.creditLedger.create({
                    data: {
                        player_id: input.playerId,
                        amount: -input.creditsSpent,
                        balance_after: account.balance,
                        reason: "purchase",
                        reference: purchase.id,
                        idempotency_key: `purchase:${input.idempotencyKey}`,
                        actor: input.actor,
                        metadata: { sku: input.sku },
                    },
                });
            }
            await tx.vipEntitlement.create({
                data: {
                    player_id: input.playerId,
                    tier: "VIP",
                    granted_by: input.actor,
                    reason: `Purchased ${input.sku}`,
                    idempotency_key: `purchase:${input.idempotencyKey}:vip`.slice(0, 120),
                },
            });
            return purchase;
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return prisma.purchase.findFirstOrThrow({
                where: {
                    OR: [
                        { idempotency_key: input.idempotencyKey },
                        ...(input.externalReference ? [{ external_reference: input.externalReference }] : []),
                    ],
                },
            });
        }
        throw error;
    }
}

async function setCosmetics(
    playerId: string,
    input: {
        welcomeMessage?: string | null;
        roomName?: string | null;
        botName?: string | null;
        pictureUrl?: string | null;
        updatedBy: string;
    },
) {
    const data = {
        ...(input.welcomeMessage !== undefined ? { welcome_message: input.welcomeMessage } : {}),
        ...(input.roomName !== undefined ? { room_name: input.roomName } : {}),
        ...(input.botName !== undefined ? { bot_name: input.botName } : {}),
        ...(input.pictureUrl !== undefined ? { picture_url: input.pictureUrl } : {}),
        updated_by: input.updatedBy,
    };
    return prisma.playerCosmetics.upsert({
        where: { player_id: playerId },
        create: { player_id: playerId, ...data },
        update: data,
    });
}

async function setProfileName(playerId: string, username: string) {
    const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId }, select: { metadata: true } });
    const currentMetadata =
        player.metadata && typeof player.metadata === "object" && !Array.isArray(player.metadata)
            ? (player.metadata as JsonMetadata)
            : {};
    const changedAtValue = currentMetadata.profile_name_changed_at;
    const changedAt = typeof changedAtValue === "string" ? new Date(changedAtValue) : null;
    const availableAt = changedAt ? new Date(changedAt.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
    if (availableAt && availableAt > new Date()) throw new ProfileNameCooldownError(availableAt);

    const claimed: { id: string }[] = await prisma.$queryRaw`
        SELECT id FROM player
        WHERE id <> ${playerId}::UUID
        AND LOWER(metadata->>'profile_name') = LOWER(${username})
        LIMIT 1
    `;
    if (claimed[0]) throw new ProfileNameConflictError("Profile name is already claimed");

    await prisma.player.update({
        where: { id: playerId },
        data: {
            metadata: asJson({
                ...currentMetadata,
                profile_name: username,
                profile_name_changed_at: new Date().toISOString(),
            }),
        },
    });
    return { playerId, username };
}

async function grantVip(
    playerId: string,
    input: {
        tier: VipTier;
        startsAt?: string;
        expiresAt?: string | null;
        grantedBy: string;
        reason?: string | null;
        idempotencyKey: string;
    },
) {
    return prisma.vipEntitlement.upsert({
        where: { idempotency_key: input.idempotencyKey },
        create: {
            player_id: playerId,
            tier: input.tier,
            starts_at: input.startsAt ? new Date(input.startsAt) : undefined,
            expires_at: input.expiresAt ? new Date(input.expiresAt) : null,
            granted_by: input.grantedBy,
            reason: input.reason,
            idempotency_key: input.idempotencyKey,
        },
        update: {},
    });
}

async function listMilestones(input: {
    type: MilestoneType;
    language: TLanguage;
    mode: TMode;
    category?: TRecord;
    milestone?: number;
    limit?: number;
}) {
    return prisma.playerMilestone.findMany({
        where: {
            type: input.type,
            language: languageEnumToDatabaseEnumMap[input.language],
            mode: modeEnumToDatabaseEnumMap[input.mode],
            category: input.category,
            milestone: input.milestone,
        },
        orderBy: [{ value: "asc" }, { achieved_at: "asc" }],
        take: input.limit ?? 20,
        include: {
            player: {
                select: { account_name: true, metadata: true },
            },
        },
    });
}

type MilestoneInput = {
    playerId: string;
    type: MilestoneType;
    language: TLanguage;
    mode: TMode;
    category: TRecord;
    milestone: number;
    value: number;
    achievedAt?: string;
    source?: string;
    idempotencyKey: string;
    metadata: JsonMetadata;
};

async function recordMilestone(input: MilestoneInput) {
    const byIdempotency = await prisma.playerMilestone.findUnique({
        where: { idempotency_key: input.idempotencyKey },
    });
    if (byIdempotency) return byIdempotency;

    const language = languageEnumToDatabaseEnumMap[input.language];
    const mode = modeEnumToDatabaseEnumMap[input.mode];
    const achievedAt = input.achievedAt ? new Date(input.achievedAt) : new Date();
    try {
        await prisma.$executeRaw(Prisma.sql`
            INSERT INTO "player_milestone"
                ("id", "player_id", "type", "language", "mode", "category", "milestone",
                 "value", "achieved_at", "source", "idempotency_key", "metadata")
            VALUES
                (gen_random_uuid(), ${input.playerId}::uuid, ${input.type}::milestone_type,
                 ${language}::language, ${mode}::game_mode, ${input.category}, ${input.milestone},
                 ${input.value}, ${achievedAt}, ${input.source ?? null}, ${input.idempotencyKey},
                 ${JSON.stringify(input.metadata)}::jsonb)
            ON CONFLICT ("player_id", "type", "language", "mode", "category", "milestone")
            DO UPDATE SET
                "value" = EXCLUDED."value",
                "achieved_at" = EXCLUDED."achieved_at",
                "source" = EXCLUDED."source",
                "idempotency_key" = EXCLUDED."idempotency_key",
                "metadata" = EXCLUDED."metadata"
            WHERE EXCLUDED."value" < "player_milestone"."value"
        `);
    } catch (error) {
        const raced = await prisma.playerMilestone.findUnique({
            where: { idempotency_key: input.idempotencyKey },
        });
        if (raced) return raced;
        throw error;
    }

    return prisma.playerMilestone.findUniqueOrThrow({
        where: {
            player_id_type_language_mode_category_milestone: {
                player_id: input.playerId,
                type: input.type,
                language,
                mode,
                category: input.category,
                milestone: input.milestone,
            },
        },
    });
}

async function mutateXp(input: {
    playerId: string;
    operation: "ADD" | "SET";
    amount: number;
    reason: string;
    idempotencyKey: string;
    actor: string;
    metadata: JsonMetadata;
}) {
    const existing = await prisma.xpLedger.findUnique({ where: { idempotency_key: input.idempotencyKey } });
    if (existing) return existing;

    try {
        return await prisma.$transaction(async (tx) => {
            const player = await tx.player.findUniqueOrThrow({
                where: { id: input.playerId },
                select: { xp: true },
            });
            const nextXp = input.operation === "ADD" ? player.xp + input.amount : input.amount;
            if (nextXp < 0) throw new InvalidXpMutationError("XP cannot be negative");
            await tx.player.update({ where: { id: input.playerId }, data: { xp: nextXp } });
            return tx.xpLedger.create({
                data: {
                    player_id: input.playerId,
                    amount: input.operation === "ADD" ? input.amount : nextXp - player.xp,
                    xp_after: nextXp,
                    operation: input.operation,
                    reason: input.reason,
                    idempotency_key: input.idempotencyKey,
                    actor: input.actor,
                    metadata: asJson(input.metadata),
                },
            });
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return prisma.xpLedger.findUniqueOrThrow({ where: { idempotency_key: input.idempotencyKey } });
        }
        throw error;
    }
}

async function getModerationState(playerId: string) {
    return prisma.moderationState.findUnique({ where: { player_id: playerId } });
}

async function setModerationState(
    playerId: string,
    input: {
        trustScore?: number;
        blacklisted?: boolean;
        blacklistReason?: string | null;
        suppressed?: boolean;
        suppressReason?: string | null;
        updatedBy: string;
    },
) {
    const data = {
        ...(input.trustScore !== undefined ? { trust_score: input.trustScore } : {}),
        ...(input.blacklisted !== undefined ? { blacklisted: input.blacklisted } : {}),
        ...(input.blacklistReason !== undefined ? { blacklist_reason: input.blacklistReason } : {}),
        ...(input.suppressed !== undefined ? { suppressed: input.suppressed } : {}),
        ...(input.suppressReason !== undefined ? { suppress_reason: input.suppressReason } : {}),
        updated_by: input.updatedBy,
    };
    return prisma.moderationState.upsert({
        where: { player_id: playerId },
        create: { player_id: playerId, ...data },
        update: data,
    });
}

async function listNews(includeDrafts: boolean, limit: number) {
    return prisma.newsEntry.findMany({
        where: includeDrafts ? undefined : { published: true, published_at: { lte: new Date() } },
        orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
        take: limit,
    });
}

async function createNews(input: {
    title: string;
    body: string;
    published: boolean;
    publishedAt?: string | null;
    actor: string;
    idempotencyKey: string;
}) {
    return prisma.newsEntry.upsert({
        where: { idempotency_key: input.idempotencyKey },
        create: {
            title: input.title,
            body: input.body,
            published: input.published,
            published_at: input.publishedAt ? new Date(input.publishedAt) : input.published ? new Date() : null,
            created_by: input.actor,
            updated_by: input.actor,
            idempotency_key: input.idempotencyKey,
        },
        update: {},
    });
}

async function updateNews(
    id: string,
    input: {
        title?: string;
        body?: string;
        published?: boolean;
        publishedAt?: string | null;
        actor: string;
    },
) {
    return prisma.newsEntry.update({
        where: { id },
        data: {
            title: input.title,
            body: input.body,
            published: input.published,
            published_at:
                input.publishedAt !== undefined
                    ? input.publishedAt
                        ? new Date(input.publishedAt)
                        : null
                    : input.published === true
                      ? new Date()
                      : undefined,
            updated_by: input.actor,
        },
    });
}

export {
    createNews,
    getEconomyProfile,
    getModerationState,
    grantVip,
    InsufficientCreditsError,
    InvalidPurchaseError,
    InvalidXpMutationError,
    listMilestones,
    listNews,
    mutateCredits,
    mutateXp,
    recordMilestone,
    recordPurchase,
    setCosmetics,
    setModerationState,
    setProfileName,
    ProfileNameConflictError,
    ProfileNameCooldownError,
    updateNews,
};