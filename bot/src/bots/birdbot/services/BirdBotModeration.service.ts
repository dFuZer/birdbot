import type { Chatter } from "../../../lib/types/gameTypes";
import type { EventCtx } from "../../../lib/types/libEventTypes";
import { l, t } from "../texts/BirdBotTextUtils";
import BirdBotParityApiService from "./BirdBotParityApi.service";

export type BirdBotModerationConfig = Readonly<{
    enabled: boolean;
    bannedNicknameWords: readonly string[];
    bannedNicknameChars: readonly string[];
    spamWindowMs: number;
    softMessageLimit: number;
    hardMessageLimit: number;
    temporaryBanMs: number;
}>;

type PeerSpamState = {
    timestamps: number[];
    warned: boolean;
    banned: boolean;
    unbanTimer?: NodeJS.Timeout;
};

const listFromEnv = (name: string, defaults: readonly string[]) => {
    const value = process.env[name];
    return value === undefined
        ? defaults
        : value
              .split(",")
              .map((item) => item.trim().toLowerCase())
              .filter(Boolean);
};

const integerFromEnv = (name: string, fallback: number, minimum: number) => {
    const parsed = Number(process.env[name]);
    return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
};
const softMessageLimit = integerFromEnv("BIRDBOT_MODERATION_SOFT_MESSAGE_LIMIT", 5, 1);
const hardMessageLimit = Math.max(
    softMessageLimit + 1,
    integerFromEnv("BIRDBOT_MODERATION_HARD_MESSAGE_LIMIT", 8, 2),
);

export default class BirdBotModerationService {
    public static readonly config: BirdBotModerationConfig = Object.freeze({
        enabled: process.env.BIRDBOT_MODERATION_ENABLED !== "false",
        bannedNicknameWords: listFromEnv("BIRDBOT_MODERATION_BANNED_NICKNAME_WORDS", [
            "nigger",
            "nigga",
            "hitler",
            "nazi",
            "kkk",
        ]),
        bannedNicknameChars: listFromEnv("BIRDBOT_MODERATION_BANNED_NICKNAME_CHARS", ["卐", "卍"]),
        spamWindowMs: integerFromEnv("BIRDBOT_MODERATION_SPAM_WINDOW_MS", 5_000, 250),
        softMessageLimit,
        hardMessageLimit,
        temporaryBanMs: integerFromEnv("BIRDBOT_MODERATION_TEMP_BAN_MS", 10_000, 1_000),
    });

    private static readonly spamByRoom = new WeakMap<object, Map<number, PeerSpamState>>();

    public static async isTrusted(accountName: string | null): Promise<boolean> {
        if (!accountName) return false;
        try {
            const player = await BirdBotParityApiService.resolvePlayer(accountName, true);
            const moderation = await BirdBotParityApiService.getModeration(player.playerId);
            return moderation.trust_score > 0 && !moderation.blacklisted;
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
            const player = await BirdBotParityApiService.resolvePlayer(chatter.authId, true);
            const moderation = await BirdBotParityApiService.getModeration(player.playerId);
            if (moderation.blacklisted) {
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

    /** Returns false when the message must not reach command dispatch. */
    public static handleChatMessage(ctx: EventCtx, chatter: Chatter): boolean {
        if (!this.config.enabled || this.isPrivileged(ctx, chatter)) return true;

        const states = this.roomSpamStates(ctx);
        const now = Date.now();
        const state = states.get(chatter.peerId) ?? { timestamps: [], warned: false, banned: false };
        state.timestamps = state.timestamps.filter((timestamp) => now - timestamp <= this.config.spamWindowMs);
        state.timestamps.push(now);
        states.set(chatter.peerId, state);

        if (state.timestamps.length >= this.config.hardMessageLimit) {
            if (!state.banned) {
                state.banned = true;
                ctx.utils.sendChatMessage(
                    t("eventHandler.moderation.spamTimeout", { username: chatter.nickname, lng: l(ctx) }),
                    "error",
                );
                ctx.utils.setUserBanned(chatter.peerId, true);
                chatter.isBanned = true;
                state.unbanTimer = setTimeout(() => {
                    ctx.utils.setUserBanned(chatter.peerId, false);
                    chatter.isBanned = false;
                    states.delete(chatter.peerId);
                }, this.config.temporaryBanMs);
                state.unbanTimer.unref();
            }
            return false;
        }

        if (state.timestamps.length >= this.config.softMessageLimit) {
            if (!state.warned) {
                state.warned = true;
                ctx.utils.sendChatMessage(
                    t("eventHandler.moderation.spamWarning", { username: chatter.nickname, lng: l(ctx) }),
                    "important",
                );
            }
            return false;
        }

        return true;
    }

    private static shouldAutoGrantModerator(ctx: EventCtx, chatter: Chatter): boolean {
        return (
            chatter.isModerator ||
            ctx.utils.userIsAdmin(chatter.authId) ||
            (!!chatter.authId && chatter.authId === ctx.room.constantRoomData.roomCreatorAuthId)
        );
    }

    private static isPrivileged(ctx: EventCtx, chatter: Chatter): boolean {
        return this.shouldAutoGrantModerator(ctx, chatter);
    }

    private static invalidNicknameReason(nickname: string): "bannedWord" | "bannedCharacter" | null {
        const normalized = nickname.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase();
        const word = this.config.bannedNicknameWords.find((item) => normalized.includes(item));
        if (word) return "bannedWord";
        const char = this.config.bannedNicknameChars.find((item) => nickname.includes(item));
        return char ? "bannedCharacter" : null;
    }

    private static roomSpamStates(ctx: EventCtx): Map<number, PeerSpamState> {
        const room = ctx.room.rawRoom;
        let states = this.spamByRoom.get(room);
        if (!states) {
            states = new Map();
            this.spamByRoom.set(room, states);
        }
        return states;
    }
}
