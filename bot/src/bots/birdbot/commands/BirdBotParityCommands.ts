import type { Command, CommandHandlerCtx } from "../../../lib/class/CommandUtils.class";
import CommandUtils from "../../../lib/class/CommandUtils.class";
import Utilitary from "../../../lib/class/Utilitary.class";
import {
    bbv7MetaRecordMilestones,
    languageEnumSchema,
    listedRecordsPerLanguage,
    modesEnumSchema,
    recordAliases,
    recordsUtils,
    semiListedRecordsPerLanguage,
} from "../BirdBotConstants";
import type { BirdBotGameMode, BirdBotLanguage, BirdBotRecordType, BirdBotRoomMetadata } from "../BirdBotTypes";
import BirdBotModerationService from "../services/BirdBotModeration.service";
import BirdBotParityApiService, {
    BirdBotApiError,
    type BirdBotEconomyProfile,
    type BirdBotMilestone,
} from "../services/BirdBotParityApi.service";
import { l, t } from "../texts/BirdBotTextUtils";

const c = CommandUtils.createCommandHelper;
type MetaRecordCategory = keyof typeof bbv7MetaRecordMilestones;

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
    return profileName || record.player?.auth_id || "unknown";
}

const globalMetaCategories = [
    "word",
    "flips",
    "alpha",
    "depleted_syllables",
    "multi_syllable",
    "previous_syllable",
] satisfies MetaRecordCategory[];

function categoriesForLanguage(language: BirdBotLanguage): BirdBotRecordType[] {
    return [
        ...globalMetaCategories,
        "time",
        "no_death",
        ...semiListedRecordsPerLanguage[language],
        ...listedRecordsPerLanguage[language],
    ];
}

function resolveMetaCategory(language: BirdBotLanguage, alias: string): BirdBotRecordType | undefined {
    return categoriesForLanguage(language).find((record) => recordAliases[record].includes(alias));
}

function parseMetaScope(ctx: CommandHandlerCtx): {
    language: BirdBotLanguage;
    mode: BirdBotGameMode;
    category?: BirdBotRecordType;
    page: number;
} {
    const metadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
    let language = metadata.gameplayLanguage;
    let mode = metadata.gameMode === "custom" ? "regular" : metadata.gameMode;
    for (const param of ctx.params) {
        const parsedLanguage = languageEnumSchema.safeParse(param);
        if (parsedLanguage.success) language = parsedLanguage.data;
        const parsedMode = modesEnumSchema.safeParse(param === "hardcore" ? "blitz" : param);
        if (parsedMode.success) mode = parsedMode.data;
    }
    const category = ctx.args[0] ? resolveMetaCategory(language, ctx.args[0]) : undefined;
    const pageNumber = Number(ctx.args[1]);
    const page = Number.isFinite(pageNumber) ? Math.max(1, Math.floor(pageNumber)) : 1;
    return { language, mode, category, page };
}

function formatMetaValue(type: "SPEED" | "ACCURACY", value: number, language: BirdBotLanguage): string {
    return type === "SPEED"
        ? Utilitary.formatTime(value)
        : t("command.parity.accuracyValue", { value: Math.round(value), lng: language });
}

function metaCategoryName(category: BirdBotRecordType, language: BirdBotLanguage): string {
    return t(`lib.recordType.${category}.recordName`, { lng: language });
}

function recordsCommand(type: "SPEED" | "ACCURACY", aliases: Command["aliases"]): Command {
    return c({
        id: type === "SPEED" ? "speedRecords" : "accuracyRecords",
        aliases,
        usageDesc: `/${aliases[0]} [category] [page] [-language] [-mode]`,
        exampleUsage: `/${aliases[0]} - /${aliases[0]} alpha 2 -fr -regular`,
        accessibleInRound: true,
        allowedFromWordInput: true,
        handler: async (ctx) => {
            try {
                const scope = parseMetaScope(ctx);
                if (ctx.args[0] && !scope.category) {
                    ctx.utils.sendChatMessage(
                        t("command.parity.recordDoesNotExist", { record: ctx.args[0], lng: l(ctx) }),
                        "error",
                    );
                    return;
                }

                if (scope.category) {
                    if (type === "ACCURACY" && scope.category === "word") {
                        ctx.utils.sendChatMessage(
                            t("command.parity.noRecordsForCategory", {
                                category: metaCategoryName(scope.category, scope.language),
                                lng: l(ctx),
                            }),
                            "neutral",
                        );
                        return;
                    }
                    const base =
                        scope.category in bbv7MetaRecordMilestones
                            ? bbv7MetaRecordMilestones[scope.category as MetaRecordCategory]
                            : undefined;
                    if (!base) {
                        ctx.utils.sendChatMessage(
                            t("command.parity.noRecordsForCategory", {
                                category: metaCategoryName(scope.category, scope.language),
                                lng: l(ctx),
                            }),
                            "neutral",
                        );
                        return;
                    }
                    const milestone = base * scope.page;
                    const records = await BirdBotParityApiService.getMilestones(type, {
                        language: scope.language,
                        mode: scope.mode,
                        category: scope.category,
                        milestone,
                        limit: 5,
                    });
                    if (!records.length) {
                        ctx.utils.sendChatMessage(
                            t(
                                scope.page === 1
                                    ? "command.parity.noRecordsForCategory"
                                    : "command.parity.pageDoesNotExist",
                                {
                                    category: metaCategoryName(scope.category, scope.language),
                                    page: scope.page,
                                    lng: l(ctx),
                                },
                            ),
                            "neutral",
                        );
                        return;
                    }
                    const milestoneLabel =
                        scope.category === "alpha" ? recordsUtils.alpha.format(milestone) : String(milestone);
                    ctx.utils.sendChatMessage(
                        t("command.parity.categoryRecords", {
                            category: metaCategoryName(scope.category, scope.language),
                            milestone: milestoneLabel,
                            records: records
                                .map(
                                    (record) =>
                                        `${profileNameFromMilestone(record)}: ${formatMetaValue(type, record.value, l(ctx))}`,
                                )
                                .join(" — "),
                            lng: l(ctx),
                        }),
                        "neutral",
                    );
                    return;
                }

                const categories = categoriesForLanguage(scope.language).filter(
                    (category): category is MetaRecordCategory =>
                        category in bbv7MetaRecordMilestones && (type === "SPEED" || category !== "word"),
                );
                const bestRecords = (
                    await Promise.all(
                        categories.map(async (category) => {
                            const milestone = bbv7MetaRecordMilestones[category];
                            if (!milestone) return null;
                            const records = await BirdBotParityApiService.getMilestones(type, {
                                language: scope.language,
                                mode: scope.mode,
                                category,
                                milestone,
                                limit: 1,
                            });
                            return records[0] ? { category, record: records[0] } : null;
                        }),
                    )
                ).filter((item): item is NonNullable<typeof item> => item !== null);
                ctx.utils.sendChatMessage(
                    bestRecords.length
                        ? t("command.parity.globalRecords", {
                              mode: t(`lib.mode.${scope.mode}`, { lng: l(ctx) }),
                              records: bestRecords
                                  .map(
                                      ({ category, record }) =>
                                          `${metaCategoryName(category, scope.language)} — ${profileNameFromMilestone(record)}: ${formatMetaValue(type, record.value, l(ctx))}`,
                                  )
                                  .join(" — "),
                              lng: l(ctx),
                          })
                        : t("command.parity.noRecordsYet", {
                              mode: t(`lib.mode.${scope.mode}`, { lng: l(ctx) }),
                              lng: l(ctx),
                          }),
                    "neutral",
                );
            } catch (error) {
                reportError(ctx, error);
            }
        },
    });
}

const speedRecordsCommand = recordsCommand("SPEED", ["speedrecords", "speed", "s"]);
const accuracyRecordsCommand = recordsCommand("ACCURACY", ["accuracyrecords", "accuracy", "accu", "acc", "a"]);

const feathersCommand = c({
    id: "feathers",
    aliases: ["feathers", "feather", "credits", "credit"],
    usageDesc: "/feathers",
    exampleUsage: "/feathers",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        try {
            const player = await resolveTarget(ctx);
            const economy = await BirdBotParityApiService.getEconomy(player.playerId);
            ctx.utils.sendChatMessage(
                t("command.parity.feathers", { count: economy.balance, lng: l(ctx) }),
                "neutral",
            );
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

function vipLabel(economy: BirdBotEconomyProfile): string {
    return BirdBotParityApiService.hasVip(economy) ? "VIP" : "NONE";
}

function hasVipAccess(ctx: CommandHandlerCtx, economy: BirdBotEconomyProfile): boolean {
    return ctx.utils.userIsAdmin(ctx.gamer.authId) || BirdBotParityApiService.hasVip(economy);
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
            const label = player.playerUsername || player.playerAuthId;
            ctx.utils.sendChatMessage(
                t("command.parity.economy", {
                    player: label,
                    feathers: economy.balance,
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
    usageDesc: "/buy VIP",
    exampleUsage: "/buy VIP",
    accessibleInRound: true,
    handler: async (ctx) => {
        if (!ctx.gamer.authId) {
            ctx.utils.sendChatMessage(t("command.parity.purchaseLogin", { lng: l(ctx) }), "error");
            return;
        }
        const requested = ctx.args[0]?.toUpperCase();
        if (requested !== "VIP") {
            ctx.utils.sendChatMessage(t("command.parity.availableSkus", { lng: l(ctx) }), "info");
            return;
        }
        try {
            const player = await resolveTarget(ctx);
            const economy = await BirdBotParityApiService.getEconomy(player.playerId);
            if (BirdBotParityApiService.hasVip(economy)) {
                ctx.utils.sendChatMessage(t("command.parity.alreadyVip", { lng: l(ctx) }), "info");
                return;
            }
            await BirdBotParityApiService.buyVip(player.playerId, ctx.gamer.authId);
            ctx.utils.sendChatMessage(t("command.parity.purchasedVip", { lng: l(ctx) }), "success");
        } catch (error) {
            if (error instanceof BirdBotApiError && error.status === 409) {
                ctx.utils.sendChatMessage(t("command.parity.insufficientFeathers", { lng: l(ctx) }), "error");
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
                if (!hasVipAccess(ctx, economy)) {
                    ctx.utils.sendChatMessage(t("command.parity.cosmeticTier", { lng: l(ctx) }), "error");
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
    aliases: ["welcomemessage", "changewelcomemessage", "cwm", "changewm"],
    field: "welcomeMessage",
    maxLength: 75,
});
const roomNameCommand = cosmeticCommand({
    id: "roomName",
    aliases: ["roomname", "changeroomname", "crn"],
    field: "roomName",
    maxLength: 15,
});
const botNameCommand = cosmeticCommand({
    id: "botName",
    aliases: ["botname", "changebotname", "cbbn", "cn", "changebirdbotname"],
    field: "botName",
    maxLength: 15,
});
const pictureCommand = c({
    id: "picture",
    aliases: ["profilepicture", "changeprofilepicture", "changepfp", "cpp", "cp"],
    usageDesc: "/profilepicture",
    exampleUsage: "/profilepicture",
    accessibleInRound: true,
    handler: async (ctx) => {
        if (!ctx.gamer.authId) {
            ctx.utils.sendChatMessage(t("command.parity.cosmeticLogin", { lng: l(ctx) }), "error");
            return;
        }
        try {
            const player = await resolveTarget(ctx);
            const economy = await BirdBotParityApiService.getEconomy(player.playerId);
            if (!hasVipAccess(ctx, economy)) {
                ctx.utils.sendChatMessage(t("command.parity.cosmeticTier", { lng: l(ctx) }), "error");
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
                            player: player.playerUsername || player.playerAuthId,
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
                        player: player.playerUsername || player.playerAuthId,
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

export const birdBotVipCommands: Command[] = [
    welcomeMessageCommand,
    botNameCommand,
    roomNameCommand,
    pictureCommand,
];

export const birdBotParityCommands: Command[] = [
    speedRecordsCommand,
    accuracyRecordsCommand,
    feathersCommand,
    economyCommand,
    buyCommand,
    setNameCommand,
    newsCommand,
    moderationCommand("trust"),
    moderationCommand("blacklist"),
];
