import type { Chatter } from "../../../lib/types/gameTypes";
import type { EventCtx } from "../../../lib/types/libEventTypes";
import { l, t } from "../texts/BirdBotTextUtils";
import BirdBotParityApiService from "./BirdBotParityApi.service";

export type BirdBotModerationConfig = Readonly<{
    enabled: boolean;
    bannedNicknameWords: readonly string[];
    bannedNicknameChars: readonly string[];
    softWarnEnabled: boolean;
    temporaryBanMs: number;
}>;

type ChatMessageSample = { msg: string; time: number };
type IdentitySpamState = {
    messages: ChatMessageSample[];
};

const BBV7_BANNED_CHARS = [
    "ஹ",
    "ฏ๎๎๎๎๎๎๎๎๎๎๎๎๎๎๎๎",
    "௸",
    "௵",
    "꧄",
    "ဪ",
    "꧅",
    "⸻",
    "𒈙",
    "𒐫",
    "﷽",
    "𒌄",
    "𒈟",
    "𒍼",
    "𒁎",
    "𒀱",
    "𒌧",
    "𒅃",
    "𒈓",
    "𒍙",
    "𒊎",
    "𒄡",
    "𒅌",
    "𒁏",
    "𒀰",
    "𒐪",
    "𒐩",
    "𒈙",
    "𒐫",
] as const;

const listFromEnv = (name: string, defaults: readonly string[]) => {
    const value = process.env[name];
    return value === undefined
        ? defaults
        : value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);
};

const integerFromEnv = (name: string, fallback: number, minimum: number) => {
    const parsed = Number(process.env[name]);
    return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
};

function levenshteinDistance(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const prev = new Array(b.length + 1);
    const curr = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
    }
    return prev[b.length];
}

export default class BirdBotModerationService {
    public static readonly config: BirdBotModerationConfig = Object.freeze({
        enabled: process.env.BIRDBOT_MODERATION_ENABLED !== "false",
        bannedNicknameWords: listFromEnv("BIRDBOT_MODERATION_BANNED_NICKNAME_WORDS", ["nigg", "lurk", "pussy"]).map(
            (item) => item.toLowerCase(),
        ),
        bannedNicknameChars: listFromEnv("BIRDBOT_MODERATION_BANNED_NICKNAME_CHARS", BBV7_BANNED_CHARS),
        softWarnEnabled: true,
        temporaryBanMs: integerFromEnv("BIRDBOT_MODERATION_TEMP_BAN_MS", 10_000, 1_000),
    });

    private static readonly spamByRoom = new WeakMap<object, Map<string, IdentitySpamState>>();
    private static readonly spamSoftWarned = new Set<string>();
    private static readonly spamHardWarned = new Set<string>();
    private static readonly moderationCache = new Map<string, { blacklisted: boolean; expiresAt: number }>();

    public static async isTrusted(authId: string | null): Promise<boolean> {
        if (!authId) return false;
        try {
            const player = await BirdBotParityApiService.resolvePlayer(authId, true);
            const moderation = await BirdBotParityApiService.getModeration(player.playerId);
            return moderation.trust_score > 0 && !moderation.blacklisted;
        } catch {
            return false;
        }
    }

    public static async isBlacklisted(authId: string | null): Promise<boolean> {
        if (!authId) return false;
        const cached = this.moderationCache.get(authId);
        if (cached && cached.expiresAt > Date.now()) return cached.blacklisted;
        try {
            const player = await BirdBotParityApiService.resolvePlayer(authId, true);
            const moderation = await BirdBotParityApiService.getModeration(player.playerId);
            this.moderationCache.set(authId, {
                blacklisted: moderation.blacklisted,
                expiresAt: Date.now() + 60_000,
            });
            return moderation.blacklisted;
        } catch {
            return false;
        }
    }

    public static async handleChatterAdded(ctx: EventCtx, chatter: Chatter): Promise<void> {
        if (!this.config.enabled || chatter.peerId === ctx.room.roomState.myPeerId) return;

        if (this.shouldAutoGrantModerator(ctx, chatter)) {
            if (!chatter.isModerator) {
                ctx.utils.setUserModerator(chatter.peerId, true);
                chatter.isModerator = true;
            }
            return;
        }

        const nicknameReason = this.invalidNicknameReason(chatter.nickname);
        if (nicknameReason) {
            ctx.utils.sendChatMessage(
                t("eventHandler.moderation.invalidNickname", {
                    username: chatter.nickname,
                    reason: t(`eventHandler.moderation.${nicknameReason}`, { lng: l(ctx) }),
                    lng: l(ctx),
                }),
                "error",
            );
            ctx.utils.setUserBanned(chatter.peerId, true);
            chatter.isBanned = true;
            return;
        }

        if (!chatter.authId) return;
        try {
            if (await this.isBlacklisted(chatter.authId)) {
                ctx.utils.sendChatMessage(
                    t("eventHandler.moderation.blacklisted", { username: chatter.nickname, lng: l(ctx) }),
                    "error",
                );
                ctx.utils.setUserBanned(chatter.peerId, true);
                chatter.isBanned = true;
            }
        } catch {
            // API availability must not prevent users from joining.
        }
    }

    /** Returns false only when the message must not reach command dispatch (hard spam ban path keeps processing blocked while banned). Soft warn still returns true. */
    public static handleChatMessage(ctx: EventCtx, chatter: Chatter, rawMessage: string): boolean {
        if (!this.config.enabled || this.isPrivileged(ctx, chatter)) return true;

        const identity = chatter.authId ?? `peerId:${chatter.peerId}`;
        const now = Date.now();
        const states = this.roomSpamStates(ctx);
        const state = states.get(identity) ?? { messages: [] };
        const msg = rawMessage.trim().replace(/[ ]+/g, " ");
        state.messages.unshift({ msg, time: now });
        state.messages = state.messages.slice(0, 8).filter((item) => now - item.time < 12_000);
        states.set(identity, state);

        const charsInLastFiveSecs = state.messages
            .filter((item) => now - item.time < 5_000)
            .reduce((sum, item) => sum + item.msg.length, 0);
        let sumDifference = 0;
        for (let i = 1; i < state.messages.length; i++) {
            sumDifference += levenshteinDistance(state.messages[i - 1]!.msg, state.messages[i]!.msg);
        }
        const relativeDifference = state.messages.length ? sumDifference / state.messages.length : Infinity;
        const amountMessagesInLastThreeSeconds = state.messages.filter((item) => now - item.time < 3_000).length;
        const amountMessagesInLastSixSeconds = state.messages.filter((item) => now - item.time < 6_000).length;

        const isSpam =
            charsInLastFiveSecs > 350 ||
            amountMessagesInLastThreeSeconds > 5 ||
            (amountMessagesInLastSixSeconds > 4 && relativeDifference < 8);

        if (isSpam) {
            if (this.spamHardWarned.has(identity)) {
                ctx.utils.setUserBanned(chatter.peerId, true);
                chatter.isBanned = true;
                return false;
            }
            if (this.spamSoftWarned.has(identity)) {
                this.spamHardWarned.add(identity);
                ctx.utils.sendChatMessage(
                    t("eventHandler.moderation.spamTimeout", { username: chatter.nickname, lng: l(ctx) }),
                    "error",
                );
                ctx.utils.setUserBanned(chatter.peerId, true);
                chatter.isBanned = true;
                const unbanTimer = setTimeout(() => {
                    ctx.utils.setUserBanned(chatter.peerId, false);
                    chatter.isBanned = false;
                }, this.config.temporaryBanMs);
                unbanTimer.unref?.();
                return false;
            }
            this.spamSoftWarned.add(identity);
            ctx.utils.sendChatMessage(
                t("eventHandler.moderation.spamWarning", { username: chatter.nickname, lng: l(ctx) }),
                "important",
            );
            // BBV7 warn-only: still process the message/command.
            return true;
        }

        this.spamSoftWarned.delete(identity);
        return true;
    }

    public static invalidNicknameReason(nickname: string): "bannedWord" | "bannedCharacter" | null {
        const normalized = nickname.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase();
        const word = this.config.bannedNicknameWords.find((item) => normalized.includes(item));
        if (word) return "bannedWord";
        const char = this.config.bannedNicknameChars.find((item) => nickname.includes(item));
        return char ? "bannedCharacter" : null;
    }

    private static shouldAutoGrantModerator(ctx: EventCtx, chatter: Chatter): boolean {
        return (
            chatter.isModerator ||
            ctx.utils.userIsAdmin(chatter.authId) ||
            ctx.utils.userIsAutomod(chatter.authId) ||
            (!!chatter.authId && chatter.authId === ctx.room.constantRoomData.roomCreatorAuthId)
        );
    }

    private static isPrivileged(ctx: EventCtx, chatter: Chatter): boolean {
        return (
            ctx.utils.userIsAdmin(chatter.authId) ||
            (!!chatter.authId && chatter.authId === ctx.room.constantRoomData.roomCreatorAuthId)
        );
    }

    private static roomSpamStates(ctx: EventCtx): Map<string, IdentitySpamState> {
        const room = ctx.room.rawRoom;
        let states = this.spamByRoom.get(room);
        if (!states) {
            states = new Map();
            this.spamByRoom.set(room, states);
        }
        return states;
    }
}
