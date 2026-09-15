import type { Command, CommandHandlerCtx } from "../../../lib/class/CommandUtils.class";
import CommandUtils from "../../../lib/class/CommandUtils.class";
import BirdBotModerationService from "../services/BirdBotModeration.service";
import BirdBotParityApiService, {
    BirdBotApiError,
    type BirdBotEconomyProfile,
    type BirdBotMilestone,
    type BirdBotVipTier,
} from "../services/BirdBotParityApi.service";
import { l, t } from "../texts/BirdBotTextUtils";

const c = CommandUtils.createCommandHelper;

function reportError(ctx: CommandHandlerCtx, error: unknown): void {
    if (error instanceof BirdBotApiError && error.status === 404) {
        ctx.utils.sendChatMessage(t("error.404.player", { lng: l(ctx) }), "error");
        return;
    }
    if (error instanceof BirdBotApiError && error.status === 409) {
        ctx.utils.sendChatMessage(t("error.api.conflict", { lng: l(ctx) }), "error");
        return;
    }
    ctx.utils.sendChatMessage(t("error.api.inaccessible", { lng: l(ctx) }), "error");
}

async function resolveTarget(ctx: CommandHandlerCtx, target?: string) {
    const query = target?.trim() || ctx.gamer.authId;
    if (!query) throw new Error("LOGIN_REQUIRED");
    return BirdBotParityApiService.resolvePlayer(query, !target);
}

function profileNameFromMilestone(record: BirdBotMilestone): string {
    const metadata = record.player?.metadata;
    const profileName =
        metadata && typeof metadata === "object" && typeof metadata.profile_name === "string"
            ? metadata.profile_name
            : null;
    return profileName || record.player?.account_name || "unknown";
}

function formatMilestone(ctx: CommandHandlerCtx, record: BirdBotMilestone): string {
    const value = t(
        record.type === "SPEED" ? "command.parity.milestoneSpeed" : "command.parity.milestoneAccuracy",
        { value: Math.round(record.value), lng: l(ctx) },
    );
    return `${record.milestone.replace(/-/g, " ")}: ${value}`;
}

function recordsCommand(type: "SPEED" | "ACCURACY", aliases: Command["aliases"]): Command {
    return c({
        id: type === "SPEED" ? "speedRecords" : "accuracyRecords",
        aliases,
        usageDesc: `/${aliases[0]} [account name or profile name]`,
        exampleUsage: `/${aliases[0]} - /${aliases[0]} dfuzer`,
        accessibleInRound: true,
        allowedFromWordInput: true,
        handler: async (ctx) => {
            try {
                const targetText = ctx.normalizedTextAfterCommand.trim();
                if (!targetText) {
                    const records = await BirdBotParityApiService.getMilestones(type, { limit: 8 });
                    ctx.utils.sendChatMessage(
                        records.length
                            ? t("command.parity.globalMilestones", {
                                  type: type.toLowerCase(),
                                  records: records
                                      .map(
                                          (record) =>
                                              `${profileNameFromMilestone(record)} — ${formatMilestone(ctx, record)}`,
                                      )
                                      .join(" — "),
                                  lng: l(ctx),
                              })
                            : t("command.parity.noGlobalMilestones", {
                                  type: type.toLowerCase(),
                                  lng: l(ctx),
                              }),
                        "neutral",
                    );
                    return;
                }
                const target = await resolveTarget(ctx, targetText);
                const records = await BirdBotParityApiService.getMilestones(type, { playerId: target.playerId });
                const label = target.playerUsername || target.playerAccountName;
                ctx.utils.sendChatMessage(
                    records.length
                        ? t("command.parity.milestones", {
                              player: label,
                              type: type.toLowerCase(),
                              records: records.slice(0, 8).map((record) => formatMilestone(ctx, record)).join(" — "),
                              lng: l(ctx),
                          })
                        : t("command.parity.noMilestones", {
                              player: label,
                              type: type.toLowerCase(),
                              lng: l(ctx),
                          }),
                    "neutral",
                );
            } catch (error) {
                if (error instanceof Error && error.message === "LOGIN_REQUIRED") {
                    ctx.utils.sendChatMessage(t("command.parity.loginOrPlayer", { lng: l(ctx) }), "error");
                    return;
                }
                reportError(ctx, error);
            }
        },
    });
}

const speedRecordsCommand = recordsCommand("SPEED", ["speedrecords", "speed", "s"]);
const accuracyRecordsCommand = recordsCommand("ACCURACY", ["accuracyrecords", "accuracy", "accu", "acc", "a"]);

const creditsCommand = c({
    id: "credits",
    aliases: ["credits", "credit"],
    usageDesc: "/credits",
    exampleUsage: "/credits",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        try {
            const player = await resolveTarget(ctx);
            const economy = await BirdBotParityApiService.getEconomy(player.playerId);
            ctx.utils.sendChatMessage(
                t("command.parity.credits", { count: economy.balance, lng: l(ctx) }),
                "neutral",
            );
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

function vipLabel(economy: BirdBotEconomyProfile): string {
    return economy.vip?.tier ?? "NONE";
}

const economyCommand = c({
    id: "economy",
    aliases: ["economy", "wallet", "vip"],
    usageDesc: "/economy [player]",
    exampleUsage: "/economy - /economy dfuzer",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        try {
            const targetText = ctx.normalizedTextAfterCommand;
            const player = await resolveTarget(ctx, targetText);
            const economy = await BirdBotParityApiService.getEconomy(player.playerId);
            const label = player.playerUsername || player.playerAccountName;
            ctx.utils.sendChatMessage(
                t("command.parity.economy", {
                    player: label,
                    credits: economy.balance,
                    tier: vipLabel(economy),
                    purchases: economy.purchases.length,
                    lng: l(ctx),
                }),
                "neutral",
            );
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

const buyCommand = c({
    id: "buy",
    aliases: ["buy", "acheter", "achat"],
    usageDesc: "/buy [VIP|VIP+]",
    exampleUsage: "/buy VIP - /buy VIP+",
    accessibleInRound: true,
    handler: async (ctx) => {
        if (!ctx.gamer.authId) {
            ctx.utils.sendChatMessage(t("command.parity.purchaseLogin", { lng: l(ctx) }), "error");
            return;
        }
        const requested = ctx.args[0]?.replace(/\+/g, "_PLUS").toUpperCase();
        if (requested !== "VIP" && requested !== "VIP_PLUS") {
            ctx.utils.sendChatMessage(t("command.parity.availableSkus", { lng: l(ctx) }), "info");
            return;
        }
        try {
            const player = await resolveTarget(ctx);
            const economy = await BirdBotParityApiService.getEconomy(player.playerId);
            const rank: Record<BirdBotVipTier, number> = { NONE: 0, VIP: 1, VIP_PLUS: 2 };
            if (rank[economy.vip?.tier ?? "NONE"] >= rank[requested]) {
                ctx.utils.sendChatMessage(
                    t("command.parity.alreadyVip", { tier: economy.vip?.tier ?? "NONE", lng: l(ctx) }),
                    "info",
                );
                return;
            }
            await BirdBotParityApiService.buyVip(player.playerId, requested, ctx.gamer.authId);
            ctx.utils.sendChatMessage(
                t("command.parity.purchasedVip", {
                    tier: requested === "VIP_PLUS" ? "VIP+" : "VIP",
                    lng: l(ctx),
                }),
                "success",
            );
        } catch (error) {
            if (error instanceof BirdBotApiError && error.status === 409) {
                ctx.utils.sendChatMessage(t("command.parity.insufficientCredits", { lng: l(ctx) }), "error");
                return;
            }
            reportError(ctx, error);
        }
    },
});

const setNameCommand = c({
    id: "setName",
    aliases: ["setname"],
    usageDesc: "/setname [name]",
    exampleUsage: "/setname Patrick",
    accessibleInRound: true,
    handler: async (ctx) => {
        if (!ctx.gamer.authId) {
            ctx.utils.sendChatMessage(t("command.parity.setNameLogin", { lng: l(ctx) }), "error");
            return;
        }
        const name = ctx.normalizedTextAfterCommand.trim();
        if (name.length < 2 || name.length > 20) {
            ctx.utils.sendChatMessage(t("command.parity.invalidName", { lng: l(ctx) }), "error");
            return;
        }
        const nicknameReason = BirdBotModerationService.invalidNicknameReason(name);
        if (nicknameReason) {
            ctx.utils.sendChatMessage(
                t("eventHandler.moderation.invalidNickname", {
                    username: name,
                    reason: t(`eventHandler.moderation.${nicknameReason}`, { lng: l(ctx) }),
                    lng: l(ctx),
                }),
                "error",
            );
            return;
        }
        try {
            const player = await resolveTarget(ctx);
            await BirdBotParityApiService.setName(player.playerId, name, ctx.gamer.authId);
            ctx.utils.sendChatMessage(t("command.parity.nameSet", { name, lng: l(ctx) }), "success");
        } catch (error) {
            if (error instanceof BirdBotApiError && (error.status === 409 || error.status === 429)) {
                ctx.utils.sendChatMessage(
                    t(error.status === 409 ? "command.parity.nameClaimed" : "command.parity.nameCooldown", {
                        lng: l(ctx),
                    }),
                    "error",
                );
                return;
            }
            reportError(ctx, error);
        }
    },
});

function cosmeticCommand(config: {
    id: string;
    aliases: Command["aliases"];
    field: "welcomeMessage" | "roomName" | "botName" | "pictureUrl";
    requiredTier: Exclude<BirdBotVipTier, "NONE">;
    maxLength: number;
}): Command {
    return c({
        id: config.id,
        aliases: config.aliases,
        usageDesc: `/${config.aliases[0]} [value|clear]`,
        exampleUsage: `/${config.aliases[0]} clear`,
        accessibleInRound: true,
        handler: async (ctx) => {
            if (!ctx.gamer.authId) {
                ctx.utils.sendChatMessage(t("command.parity.cosmeticLogin", { lng: l(ctx) }), "error");
                return;
            }
            const rawValue = ctx.normalizedTextAfterCommand.trim();
            if (!rawValue) {
                ctx.utils.sendChatMessage(
                    t("command.parity.cosmeticValue", { command: config.aliases[0], lng: l(ctx) }),
                    "info",
                );
                return;
            }
            const value = rawValue.toLowerCase() === "clear" ? null : rawValue;
            if (value && value.length > config.maxLength) {
                ctx.utils.sendChatMessage(
                    t("command.parity.cosmeticTooLong", { maxLength: config.maxLength, lng: l(ctx) }),
                    "error",
                );
                return;
            }
            try {
                const player = await resolveTarget(ctx);
                const economy = await BirdBotParityApiService.getEconomy(player.playerId);
                const rank: Record<BirdBotVipTier, number> = { NONE: 0, VIP: 1, VIP_PLUS: 2 };
                if (rank[economy.vip?.tier ?? "NONE"] < rank[config.requiredTier]) {
                    ctx.utils.sendChatMessage(
                        t("command.parity.cosmeticTier", {
                            tier: config.requiredTier.replace("_PLUS", "+"),
                            lng: l(ctx),
                        }),
                        "error",
                    );
                    return;
                }
                await BirdBotParityApiService.setCosmetic(
                    player.playerId,
                    config.field,
                    value,
                    ctx.gamer.authId,
                );
                ctx.utils.sendChatMessage(
                    t(value === null ? "command.parity.cosmeticCleared" : "command.parity.cosmeticSaved", {
                        lng: l(ctx),
                    }),
                    "success",
                );
            } catch (error) {
                reportError(ctx, error);
            }
        },
    });
}

const welcomeMessageCommand = cosmeticCommand({
    id: "welcomeMessage",
    aliases: ["cwm", "changewm", "changewelcomemessage"],
    field: "welcomeMessage",
    requiredTier: "VIP",
    maxLength: 75,
});
const roomNameCommand = cosmeticCommand({
    id: "roomName",
    aliases: ["crn", "changeroomname"],
    field: "roomName",
    requiredTier: "VIP_PLUS",
    maxLength: 15,
});
const botNameCommand = cosmeticCommand({
    id: "botName",
    aliases: ["cbbn", "cn", "changebirdbotname"],
    field: "botName",
    requiredTier: "VIP",
    maxLength: 15,
});
const pictureCommand = c({
    id: "picture",
    aliases: ["cpp", "cp", "changepfp", "changeprofilepicture"],
    usageDesc: "/cpp",
    exampleUsage: "/cpp",
    accessibleInRound: true,
    handler: async (ctx) => {
        if (!ctx.gamer.authId) {
            ctx.utils.sendChatMessage(t("command.parity.cosmeticLogin", { lng: l(ctx) }), "error");
            return;
        }
        try {
            const player = await resolveTarget(ctx);
            const economy = await BirdBotParityApiService.getEconomy(player.playerId);
            const rank: Record<BirdBotVipTier, number> = { NONE: 0, VIP: 1, VIP_PLUS: 2 };
            if (rank[economy.vip?.tier ?? "NONE"] < rank.VIP_PLUS) {
                ctx.utils.sendChatMessage(
                    t("command.parity.cosmeticTier", { tier: "VIP+", lng: l(ctx) }),
                    "error",
                );
                return;
            }

            const chatSocket = ctx.room.rawRoom.chatSocket;
            if (!chatSocket) {
                ctx.utils.sendChatMessage(t("command.parity.pictureUnavailable", { lng: l(ctx) }), "error");
                return;
            }

            const picture = await new Promise<string | null>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error("getChatterProfiles timeout")), 5_000);
                chatSocket.emit("getChatterProfiles", (profiles: unknown) => {
                    clearTimeout(timeout);
                    if (!Array.isArray(profiles)) {
                        resolve(null);
                        return;
                    }
                    const match = profiles.find((profile) => {
                        if (!profile || typeof profile !== "object") return false;
                        const auth = (profile as { auth?: { id?: string } }).auth;
                        return auth?.id === ctx.gamer.authId;
                    }) as { picture?: string | null } | undefined;
                    const value = typeof match?.picture === "string" ? match.picture.trim() : "";
                    resolve(value.length > 0 ? value : null);
                });
            });

            if (!picture) {
                ctx.utils.sendChatMessage(t("command.parity.pictureUnavailable", { lng: l(ctx) }), "error");
                return;
            }

            await BirdBotParityApiService.setCosmetic(player.playerId, "pictureUrl", picture, ctx.gamer.authId);
            ctx.utils.sendChatMessage(t("command.parity.pictureCopied", { lng: l(ctx) }), "success");
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

const newsCommand = c({
    id: "news",
    aliases: ["news", "lastnews"],
    usageDesc: "/news",
    exampleUsage: "/news",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        try {
            const entries = await BirdBotParityApiService.getNews(3);
            ctx.utils.sendChatMessage(
                entries.length
                    ? entries.map((entry) => `${entry.title}: ${entry.body}`).join(" — ")
                    : t("command.parity.noNews", { lng: l(ctx) }),
                "info",
            );
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

function moderationCommand(kind: "trust" | "blacklist"): Command {
    return c({
        id: kind,
        aliases: kind === "trust" ? ["trustlist", "trust"] : ["blacklist"],
        usageDesc: `/${kind} [add|remove|show] [player]`,
        exampleUsage: `/${kind} add dfuzer`,
        adminRequired: true,
        accessibleInRound: true,
        handler: async (ctx) => {
            const action = ctx.args[0];
            const targetText = ctx.args.slice(1).join(" ");
            if (!["add", "remove", "rem", "show"].includes(action) || !targetText) {
                ctx.utils.sendChatMessage(
                    t("command.parity.moderationUsage", { command: kind, lng: l(ctx) }),
                    "info",
                );
                return;
            }
            try {
                const player = await resolveTarget(ctx, targetText);
                if (action === "show") {
                    const state = await BirdBotParityApiService.getModeration(player.playerId);
                    ctx.utils.sendChatMessage(
                        t("command.parity.moderationState", {
                            player: player.playerUsername || player.playerAccountName,
                            trust: state.trust_score,
                            blacklist: state.blacklisted
                                ? t("command.parity.yesWithReason", {
                                      reason:
                                          state.blacklist_reason ||
                                          t("command.parity.noReason", { lng: l(ctx) }),
                                      lng: l(ctx),
                                  })
                                : t("command.parity.no", { lng: l(ctx) }),
                            lng: l(ctx),
                        }),
                        "neutral",
                    );
                    return;
                }
                const adding = action === "add";
                const state =
                    kind === "trust"
                        ? await BirdBotParityApiService.setModeration(player.playerId, {
                              trustScore: adding ? 1 : 0,
                              updatedBy: ctx.gamer.authId!,
                          })
                        : await BirdBotParityApiService.setModeration(player.playerId, {
                              blacklisted: adding,
                              blacklistReason: adding ? ctx.params.join(" ") || "BirdBot admin action" : null,
                              updatedBy: ctx.gamer.authId!,
                          });
                ctx.utils.sendChatMessage(
                    t("command.parity.moderationState", {
                        player: player.playerUsername || player.playerAccountName,
                        trust: state.trust_score,
                        blacklist: t(state.blacklisted ? "command.parity.yes" : "command.parity.no", {
                            lng: l(ctx),
                        }),
                        lng: l(ctx),
                    }),
                    "success",
                );
            } catch (error) {
                reportError(ctx, error);
            }
        },
    });
}

export const birdBotParityCommands: Command[] = [
    speedRecordsCommand,
    accuracyRecordsCommand,
    creditsCommand,
    economyCommand,
    buyCommand,
    setNameCommand,
    welcomeMessageCommand,
    roomNameCommand,
    botNameCommand,
    pictureCommand,
    newsCommand,
    moderationCommand("trust"),
    moderationCommand("blacklist"),
];
