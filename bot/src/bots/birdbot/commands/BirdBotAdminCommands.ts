import type { Command, CommandHandlerCtx } from "../../../lib/class/CommandUtils.class";
import CommandUtils from "../../../lib/class/CommandUtils.class";
import Utilitary from "../../../lib/class/Utilitary.class";
import { dictionaryIdToBirdbotLanguage } from "../BirdBotConstants";
import type { BirdBotSupportedDictionaryId, DictionaryResource } from "../BirdBotTypes";
import { API_URL } from "../BirdBotEnv";
import BirdBotParityApiService, { BirdBotApiError } from "../services/BirdBotParityApi.service";
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

const loginHelpCommand = c({
    id: "loginHelp",
    aliases: ["loginhelp", "connect"],
    usageDesc: "/loginhelp",
    exampleUsage: "/loginhelp",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        ctx.utils.sendChatMessage(t("command.loginHelp.result", { lng: l(ctx) }), "info");
    },
});

const creatorIdCommand = c({
    id: "creatorId",
    aliases: ["creatorid"],
    usageDesc: "/creatorid",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            t("command.admin.creatorId", {
                id: ctx.room.constantRoomData.roomCreatorAuthId ?? "null",
                lng: l(ctx),
            }),
            "neutral",
        );
    },
});

const reconnectBotCommand = c({
    id: "reconnectBot",
    aliases: ["reconnectbot", "reconnect", "reco"],
    usageDesc: "/reconnectbot",
    exampleUsage: "/reconnectbot",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: (ctx) => {
        ctx.utils.sendChatMessage(t("command.admin.reconnecting", { lng: l(ctx) }), "info");
        void ctx.bot.rawBot.reconnectRoom(ctx.room.rawRoom);
    },
});

const playerIdCommand = c({
    id: "playerId",
    aliases: ["playerid", "getid"],
    usageDesc: "/playerid [player]",
    exampleUsage: "/playerid dfuzer",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: async (ctx) => {
        const query = ctx.normalizedTextAfterCommand.trim();
        if (!query) {
            ctx.utils.sendChatMessage(t("error.invalidParams.noUsername", { lng: l(ctx) }), "error");
            return;
        }
        try {
            const player = await BirdBotParityApiService.resolvePlayer(query);
            ctx.utils.sendChatMessage(
                t("command.admin.playerId", {
                    account: player.playerAccountName,
                    playerId: player.playerId,
                    username: player.playerUsername ?? "-",
                    lng: l(ctx),
                }),
                "neutral",
            );
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

const suppressCommand = c({
    id: "suppress",
    aliases: ["suppress"],
    usageDesc: "/suppress [player] [reason?]",
    exampleUsage: "/suppress dfuzer abuse",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: async (ctx) => {
        const target = ctx.args[0];
        if (!target) {
            ctx.utils.sendChatMessage(t("command.admin.suppressUsage", { lng: l(ctx) }), "info");
            return;
        }
        const reason = ctx.args.slice(1).join(" ") || "BirdBot admin suppress";
        try {
            const player = await BirdBotParityApiService.resolvePlayer(target);
            const state = await BirdBotParityApiService.setModeration(player.playerId, {
                suppressed: true,
                suppressReason: reason,
                blacklisted: true,
                blacklistReason: reason,
                updatedBy: ctx.gamer.authId!,
            });
            ctx.utils.sendChatMessage(
                t("command.admin.suppressResult", {
                    player: player.playerUsername || player.playerAccountName,
                    suppressed: state.suppressed
                        ? t("command.parity.yesWithReason", {
                              reason: state.suppress_reason || reason,
                              lng: l(ctx),
                          })
                        : t("command.parity.no", { lng: l(ctx) }),
                    lng: l(ctx),
                }),
                "success",
            );
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

const giveFeathersCommand = c({
    id: "giveFeathers",
    aliases: ["givefeathers", "gf", "givecredits", "gc"],
    usageDesc: "/givefeathers [player] [amount]",
    exampleUsage: "/givefeathers dfuzer 100",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: async (ctx) => {
        const target = ctx.args[0];
        const amountRaw = ctx.args[1];
        const amount = Number(amountRaw);
        if (!target || !Number.isFinite(amount) || !Number.isInteger(amount) || amount === 0) {
            ctx.utils.sendChatMessage(t("command.admin.giveFeathersUsage", { lng: l(ctx) }), "info");
            return;
        }
        try {
            const player = await BirdBotParityApiService.resolvePlayer(target);
            const entry = await BirdBotParityApiService.mutateCredits({
                playerId: player.playerId,
                amount,
                reason: "admin-givefeathers",
                actor: ctx.gamer.authId!,
            });
            ctx.utils.sendChatMessage(
                t("command.admin.giveFeathersResult", {
                    amount,
                    player: player.playerUsername || player.playerAccountName,
                    balance: entry.balance_after,
                    lng: l(ctx),
                }),
                "success",
            );
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

const giveXpCommand = c({
    id: "giveXp",
    aliases: ["givexp"],
    usageDesc: "/givexp [player] [amount]",
    exampleUsage: "/givexp dfuzer 500",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: async (ctx) => {
        const target = ctx.args[0];
        const amountRaw = ctx.args[1];
        const amount = Number(amountRaw);
        if (!target || !Number.isFinite(amount) || !Number.isInteger(amount) || amount === 0) {
            ctx.utils.sendChatMessage(t("command.admin.giveXpUsage", { lng: l(ctx) }), "info");
            return;
        }
        try {
            const player = await BirdBotParityApiService.resolvePlayer(target);
            const entry = await BirdBotParityApiService.mutateXp({
                playerId: player.playerId,
                operation: "ADD",
                amount,
                reason: "admin-givexp",
                actor: ctx.gamer.authId!,
            });
            ctx.utils.sendChatMessage(
                t("command.admin.giveXpResult", {
                    amount,
                    player: player.playerUsername || player.playerAccountName,
                    xp: entry.xp_after,
                    lng: l(ctx),
                }),
                "success",
            );
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

const setXpCommand = c({
    id: "setXp",
    aliases: ["setxp"],
    usageDesc: "/setxp [player] [amount]",
    exampleUsage: "/setxp dfuzer 1000",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: async (ctx) => {
        const target = ctx.args[0];
        const amountRaw = ctx.args[1];
        const amount = Number(amountRaw);
        if (!target || !Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) {
            ctx.utils.sendChatMessage(t("command.admin.setXpUsage", { lng: l(ctx) }), "info");
            return;
        }
        try {
            const player = await BirdBotParityApiService.resolvePlayer(target);
            const entry = await BirdBotParityApiService.mutateXp({
                playerId: player.playerId,
                operation: "SET",
                amount,
                reason: "admin-setxp",
                actor: ctx.gamer.authId!,
            });
            ctx.utils.sendChatMessage(
                t("command.admin.setXpResult", {
                    player: player.playerUsername || player.playerAccountName,
                    xp: entry.xp_after,
                    lng: l(ctx),
                }),
                "success",
            );
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

const healthCommand = c({
    id: "health",
    aliases: ["health", "status"],
    usageDesc: "/health",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: async (ctx) => {
        const rooms = Object.values(ctx.bot.rooms);
        const connected = rooms.filter((room) => room.isConnected()).length;
        let apiStatus = "unreachable";
        try {
            const response = await fetch(`${API_URL}/health`);
            apiStatus = response.ok ? "ok" : `http-${response.status}`;
        } catch {
            apiStatus = "unreachable";
        }
        ctx.utils.sendChatMessage(
            t("command.admin.health", {
                rooms: rooms.length,
                connected,
                api: apiStatus,
                uptime: Utilitary.formatTime(process.uptime() * 1000),
                lng: l(ctx),
            }),
            "neutral",
        );
    },
});

const broadcastCommand = c({
    id: "broadcast",
    aliases: ["broadcast", "bc"],
    usageDesc: "/broadcast [message]",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: (ctx) => {
        const message = ctx.args.join(" ");
        for (const roomId in ctx.bot.rooms) {
            const room = ctx.bot.rooms[roomId];
            if (room.isConnected()) {
                Utilitary.sendChatMessage(room, t("command.broadcast.message", { message, lng: l(ctx) }));
            }
        }
    },
});

const dictionaryQueueCommand = c({
    id: "dictionaryQueue",
    aliases: ["dictionaryqueue", "diag", "diagnostic"],
    adminRequired: true,
    usageDesc: "/dictionaryqueue",
    exampleUsage: "/dictionaryqueue",
    hidden: true,
    accessibleInRound: true,
    handler: (ctx) => {
        const resource = ctx.bot.getResource<DictionaryResource>("dictionary-fr");
        ctx.utils.sendChatMessage(
            t("parity.dictionary.testWords", {
                words: resource.metadata.testWords.map((testWord) => testWord.word).join(" "),
                lng: l(ctx),
            }),
            "neutral",
        );
    },
});

const destroyAllRoomsCommand = c({
    id: "destroyAllRooms",
    aliases: ["destroyallrooms"],
    usageDesc: "/destroyallrooms",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: (ctx) => {
        for (const roomId in ctx.bot.rooms) {
            const room = ctx.bot.rooms[roomId];
            if (room.isConnected()) {
                Utilitary.sendChatMessage(
                    room,
                    t("command.destroyAllRooms.destroying", {
                        lng:
                            dictionaryIdToBirdbotLanguage[
                                room.roomState.gameData?.rules.dictionaryId as BirdBotSupportedDictionaryId
                            ] ?? "en",
                    }),
                );
            }
            Utilitary.destroyRoom(ctx.bot.rawBot, room);
        }
    },
});

const showAllRoomsCommand = c({
    id: "showAllRooms",
    aliases: ["listrooms", "rooms", "roomlist", "listroom"],
    usageDesc: "/listrooms",
    exampleUsage: "/listrooms",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: (ctx) => {
        const roomsList = Object.values(ctx.bot.rooms)
            .map((room) => {
                return `${room.constantRoomData.roomCode}: ${room.roomState.gameData?.milestone.name ?? "gameData unknown"}`;
            })
            .join(" - ");
        ctx.utils.sendChatMessage(t("command.showAllRooms.result", { roomsList, lng: l(ctx) }));
    },
});

const staffCommand = c({
    id: "staff",
    aliases: ["staff"],
    usageDesc: "/staff [add|remove|show] [admin|automod] [player]",
    exampleUsage: "/staff add automod dfuzer",
    adminRequired: true,
    hidden: true,
    accessibleInRound: true,
    handler: async (ctx) => {
        const action = ctx.args[0];
        const roleRaw = ctx.args[1];
        const formatList = (items: string[]) =>
            items.length ? items.join(", ") : t("command.admin.staffEmpty", { lng: l(ctx) });

        if (!action || action === "show") {
            try {
                await (await import("../services/BirdBotStaffSync.service")).default.refresh(ctx.bot.rawBot);
                const staff = ctx.bot.rawBot.botData!.staff;
                ctx.utils.sendChatMessage(
                    t("command.admin.staffShow", {
                        admins: formatList([...staff.admins]),
                        automods: formatList([...staff.automods]),
                        lng: l(ctx),
                    }),
                    "neutral",
                );
            } catch (error) {
                reportError(ctx, error);
            }
            return;
        }

        if ((action !== "add" && action !== "remove") || (roleRaw !== "admin" && roleRaw !== "automod")) {
            ctx.utils.sendChatMessage(t("command.admin.staffUsage", { lng: l(ctx) }), "info");
            return;
        }

        const query = ctx.args.slice(2).join(" ").trim() || ctx.normalizedTextAfterCommand.split(/\s+/).slice(2).join(" ");
        if (!query) {
            ctx.utils.sendChatMessage(t("command.admin.staffUsage", { lng: l(ctx) }), "info");
            return;
        }

        const role = roleRaw === "admin" ? "ADMIN" : "AUTOMOD";
        try {
            const player = await BirdBotParityApiService.resolvePlayer(query);
            const accountName = player.playerAccountName;
            const updatedBy = ctx.gamer.authId!;
            if (action === "add") {
                await BirdBotParityApiService.putStaff(accountName, role, updatedBy);
            } else {
                await BirdBotParityApiService.deleteStaff(accountName, role, updatedBy);
            }
            const BirdBotStaffSync = (await import("../services/BirdBotStaffSync.service")).default;
            await BirdBotStaffSync.refresh(ctx.bot.rawBot);
            const staff = ctx.bot.rawBot.botData!.staff;
            ctx.utils.sendChatMessage(
                t("command.admin.staffUpdated", {
                    admins: formatList([...staff.admins]),
                    automods: formatList([...staff.automods]),
                    lng: l(ctx),
                }),
                "success",
            );
        } catch (error) {
            reportError(ctx, error);
        }
    },
});

export const birdBotAdminCommands: Command[] = [
    loginHelpCommand,
    creatorIdCommand,
    reconnectBotCommand,
    playerIdCommand,
    suppressCommand,
    giveFeathersCommand,
    giveXpCommand,
    setXpCommand,
    healthCommand,
    broadcastCommand,
    dictionaryQueueCommand,
    destroyAllRoomsCommand,
    showAllRoomsCommand,
    staffCommand,
];
