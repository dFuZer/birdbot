import { createHash } from "crypto";
import { z } from "zod";
import { API_KEY, API_URL } from "../BirdBotEnv";
import { bbv7MetaRecordMilestones, scoreKeyPerMetaRecord } from "../BirdBotConstants";
import type { BirdBotGameMode, BirdBotLanguage, BirdBotRecordType, BirdBotWordMilestone, PlayerGameScores } from "../BirdBotTypes";

const profileSchema = z.object({
    playerId: z.string().uuid(),
    playerAccountName: z.string(),
    playerUsername: z.string().nullable().optional(),
});

const vipTierSchema = z.enum(["NONE", "VIP", "VIP_PLUS"]);
const vipSchema = z
    .object({
        tier: vipTierSchema,
        starts_at: z.string().or(z.date()),
        expires_at: z.string().or(z.date()).nullable(),
    })
    .nullable();
const cosmeticsSchema = z
    .object({
        welcome_message: z.string().nullable(),
        room_name: z.string().nullable(),
        bot_name: z.string().nullable(),
        picture_url: z.string().nullable(),
    })
    .nullable();
const purchaseSchema = z.object({
    id: z.string().uuid(),
    sku: z.string(),
    credits_spent: z.number().int(),
    purchased_at: z.string().or(z.date()),
});
const economySchema = z.object({
    balance: z.number().int(),
    cosmetics: cosmeticsSchema,
    vip: vipSchema,
    purchases: z.array(purchaseSchema),
});
const milestoneSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(["SPEED", "ACCURACY"]),
    language: z.enum(["FR", "EN", "DE", "ES", "BRPT", "IT"]),
    mode: z.enum(["REGULAR", "EASY", "BLITZ", "SUB500", "SUB50", "FREEPLAY"]),
    category: z.string(),
    milestone: z.number().int(),
    value: z.number(),
    achieved_at: z.string().or(z.date()),
    source: z.string().nullable().optional(),
    metadata: z.record(z.unknown()),
    player: z
        .object({
            account_name: z.string(),
            metadata: z.record(z.unknown()).nullable().optional(),
        })
        .optional(),
});
const moderationSchema = z.object({
    player_id: z.string().uuid(),
    trust_score: z.number().int(),
    blacklisted: z.boolean(),
    blacklist_reason: z.string().nullable(),
    suppressed: z.boolean(),
    suppress_reason: z.string().nullable(),
});
const creditLedgerSchema = z.object({
    id: z.string().uuid(),
    amount: z.number().int(),
    balance_after: z.number().int(),
    reason: z.string(),
});
const xpLedgerSchema = z.object({
    id: z.string().uuid(),
    amount: z.number().int(),
    xp_after: z.number().int(),
    operation: z.string(),
    reason: z.string(),
});
const newsSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    body: z.string(),
    published: z.boolean(),
    published_at: z.string().or(z.date()).nullable(),
});
const nameSchema = z.object({
    playerId: z.string().uuid(),
    username: z.string(),
});
const staffSchema = z.object({
    admins: z.array(z.string()),
    automods: z.array(z.string()),
});
const botRoomSchema = z.object({
    roomCode: z.string(),
    userToken: z.string(),
    serverUrl: z.string().nullable(),
    creatorAuthId: z.string().nullable(),
    targetConfig: z.record(z.unknown()),
    updatedAt: z.string().or(z.date()).optional(),
});

export type BirdBotPlayerProfile = z.infer<typeof profileSchema>;
export type BirdBotEconomyProfile = z.infer<typeof economySchema>;
export type BirdBotMilestone = z.infer<typeof milestoneSchema>;
export type BirdBotModerationState = z.infer<typeof moderationSchema>;
export type BirdBotVipTier = z.infer<typeof vipTierSchema>;
export type BirdBotCreditLedger = z.infer<typeof creditLedgerSchema>;
export type BirdBotXpLedger = z.infer<typeof xpLedgerSchema>;
export type BirdBotStaffList = z.infer<typeof staffSchema>;
export type BirdBotPersistedRoom = z.infer<typeof botRoomSchema>;

const VIP_PRICE_FEATHERS = 500;

export class BirdBotApiError extends Error {
    public constructor(
        public readonly status: number,
        public readonly responseBody: string,
    ) {
        super(`BirdBot API returned HTTP ${status}`);
        this.name = "BirdBotApiError";
    }
}

export default class BirdBotParityApiService {
    public static async resolvePlayer(query: string, exactAccountName = false): Promise<BirdBotPlayerProfile> {
        const key = exactAccountName ? "accountName" : "searchByName";
        return this.request(`/player-profile?${key}=${encodeURIComponent(query)}`, profileSchema);
    }

    public static async getEconomy(playerId: string): Promise<BirdBotEconomyProfile> {
        return this.request(`/economy/${encodeURIComponent(playerId)}`, economySchema);
    }

    public static hasVip(economy: BirdBotEconomyProfile): boolean {
        const tier = economy.vip?.tier;
        return tier === "VIP" || tier === "VIP_PLUS";
    }

    public static async getMilestones(
        type: "SPEED" | "ACCURACY",
        options: {
            language: BirdBotLanguage;
            mode: BirdBotGameMode;
            category?: BirdBotRecordType;
            milestone?: number;
            limit?: number;
        },
    ): Promise<BirdBotMilestone[]> {
        const params = new URLSearchParams({ type, language: options.language, mode: options.mode });
        if (options.category) params.set("category", options.category);
        if (options.milestone) params.set("milestone", String(options.milestone));
        if (options.limit) params.set("limit", String(options.limit));
        return this.request(`/meta/records?${params.toString()}`, z.array(milestoneSchema));
    }

    public static async getModeration(playerId: string): Promise<BirdBotModerationState> {
        return this.request(`/moderation/${encodeURIComponent(playerId)}`, moderationSchema);
    }

    public static async setModeration(
        playerId: string,
        body: {
            trustScore?: number;
            blacklisted?: boolean;
            blacklistReason?: string | null;
            suppressed?: boolean;
            suppressReason?: string | null;
            updatedBy: string;
        },
    ): Promise<BirdBotModerationState> {
        return this.request(`/moderation/${encodeURIComponent(playerId)}`, moderationSchema, "PATCH", body);
    }

    public static async mutateCredits(input: {
        playerId: string;
        amount: number;
        reason: string;
        actor: string;
        reference?: string;
    }): Promise<BirdBotCreditLedger> {
        return this.request("/economy/credits", creditLedgerSchema, "POST", {
            ...input,
            idempotencyKey: this.idempotencyKey(
                "credits",
                input.playerId,
                input.reason,
                String(input.amount),
                Date.now().toString(),
            ),
            metadata: { source: "birdbot-admin" },
        });
    }

    public static async mutateXp(input: {
        playerId: string;
        operation: "ADD" | "SET";
        amount: number;
        reason: string;
        actor: string;
    }): Promise<BirdBotXpLedger> {
        return this.request("/economy/xp", xpLedgerSchema, "POST", {
            ...input,
            idempotencyKey: this.idempotencyKey(
                "xp",
                input.playerId,
                input.operation,
                input.reason,
                String(input.amount),
                Date.now().toString(),
            ),
            metadata: { source: "birdbot-admin" },
        });
    }

    public static async getNews(limit: number): Promise<z.infer<typeof newsSchema>[]> {
        return this.request(`/news?limit=${limit}`, z.array(newsSchema));
    }

    public static async setName(playerId: string, username: string, actor: string): Promise<z.infer<typeof nameSchema>> {
        return this.request(`/profile/${encodeURIComponent(playerId)}/name`, nameSchema, "PATCH", {
            username,
            updatedBy: actor,
        });
    }

    public static async setCosmetic(
        playerId: string,
        field: "welcomeMessage" | "roomName" | "botName" | "pictureUrl",
        value: string | null,
        actor: string,
    ): Promise<NonNullable<BirdBotEconomyProfile["cosmetics"]>> {
        return this.request(`/profile/${encodeURIComponent(playerId)}/cosmetics`, cosmeticsSchema.unwrap(), "PATCH", {
            [field]: value,
            updatedBy: actor,
        });
    }

    public static async buyVip(playerId: string, actor: string): Promise<void> {
        const sku = "VIP";
        const operationId = this.idempotencyKey("purchase", playerId, sku, Date.now().toString());
        await this.request("/economy/purchases", purchaseSchema, "POST", {
            playerId,
            sku,
            creditsSpent: VIP_PRICE_FEATHERS,
            idempotencyKey: operationId,
            actor,
            metadata: { source: "birdbot-command" },
        });
    }

    public static async getStaff(): Promise<BirdBotStaffList> {
        return this.request("/staff", staffSchema);
    }

    public static async putStaff(accountName: string, role: "ADMIN" | "AUTOMOD", updatedBy: string): Promise<BirdBotStaffList> {
        return this.request("/staff", staffSchema, "PUT", { accountName, role, updatedBy });
    }

    public static async deleteStaff(
        accountName: string,
        role: "ADMIN" | "AUTOMOD",
        updatedBy: string,
    ): Promise<BirdBotStaffList> {
        return this.request("/staff", staffSchema, "DELETE", { accountName, role, updatedBy });
    }

    public static async listBotRooms(): Promise<BirdBotPersistedRoom[]> {
        return this.request("/bot/rooms", z.array(botRoomSchema));
    }

    public static async upsertBotRoom(input: {
        roomCode: string;
        userToken: string;
        serverUrl: string | null;
        creatorAuthId: string | null;
        targetConfig: Record<string, unknown>;
    }): Promise<BirdBotPersistedRoom> {
        return this.request(`/bot/rooms/${encodeURIComponent(input.roomCode)}`, botRoomSchema, "PUT", {
            userToken: input.userToken,
            serverUrl: input.serverUrl,
            creatorAuthId: input.creatorAuthId,
            targetConfig: input.targetConfig,
        });
    }

    public static async deleteBotRoom(roomCode: string): Promise<void> {
        await this.request(`/bot/rooms/${encodeURIComponent(roomCode)}`, z.any().optional(), "DELETE");
    }

    public static async createBanEvent(input: {
        playerAccount: string;
        roomCode: string;
        moderatorAccounts: string[];
    }): Promise<void> {
        await this.request(
            "/bans",
            z.object({ id: z.string().uuid() }).passthrough(),
            "POST",
            input,
        );
    }

    public static makeIdempotencyKey(...parts: string[]): string {
        return this.idempotencyKey(...parts);
    }

    public static buildCategoryMilestones(input: {
        gameId: string;
        turnKey: string;
        word: string;
        elapsedMs: number;
        wordsUsed: number;
        before: PlayerGameScores;
        after: PlayerGameScores;
    }): BirdBotWordMilestone[] {
        const milestones: BirdBotWordMilestone[] = [];
        const metadata = {
            gameId: input.gameId,
            turnKey: input.turnKey,
            word: input.word,
            elapsedMs: input.elapsedMs,
            wordsUsed: input.wordsUsed,
        };

        for (const [category, step] of Object.entries(bbv7MetaRecordMilestones) as [
            keyof typeof bbv7MetaRecordMilestones,
            number,
        ][]) {
            const scoreKey = scoreKeyPerMetaRecord[category];
            const before = input.before[scoreKey] as number;
            const after = input.after[scoreKey] as number;
            const firstCrossed = (Math.floor(before / step) + 1) * step;
            for (let milestone = firstCrossed; milestone <= after; milestone += step) {
                milestones.push({
                    type: "SPEED",
                    category,
                    milestone,
                    value: input.elapsedMs,
                    idempotencyKey: this.idempotencyKey(
                        input.gameId,
                        input.turnKey,
                        "SPEED",
                        category,
                        String(milestone),
                    ),
                    metadata,
                });
                if (category !== "word") {
                    milestones.push({
                        type: "ACCURACY",
                        category,
                        milestone,
                        value: input.wordsUsed,
                        idempotencyKey: this.idempotencyKey(
                            input.gameId,
                            input.turnKey,
                            "ACCURACY",
                            category,
                            String(milestone),
                        ),
                        metadata,
                    });
                }
            }
        }
        return milestones;
    }

    private static idempotencyKey(...parts: string[]): string {
        return `birdbot:${createHash("sha256").update(parts.join(":")).digest("hex").slice(0, 48)}`;
    }

    private static async request<T>(
        path: string,
        schema: z.ZodType<T>,
        method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" = "GET",
        body?: unknown,
    ): Promise<T> {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${API_KEY}`,
        };
        const payload = body === undefined ? undefined : JSON.stringify(body);
        if (payload !== undefined) {
            headers["Content-Type"] = "application/json";
        }
        const response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: payload,
        });
        if (response.status === 204) {
            return schema.parse(undefined);
        }
        const responseBody = await response.text();
        if (!response.ok) throw new BirdBotApiError(response.status, responseBody);
        return schema.parse(responseBody ? (JSON.parse(responseBody) as unknown) : undefined);
    }
}
