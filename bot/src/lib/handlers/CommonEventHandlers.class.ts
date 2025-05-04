import Logger from "../class/Logger.class";
import Utilitary from "../class/Utilitary.class";
import type { BotEventHandlerFn } from "../types/libEventTypes";

export class CommonEventHandlers {
    public static open: BotEventHandlerFn = (ctx) => {
        const msg = ctx.bot.networkAdapter.getHelloMessage({
            secret: ctx.bot.session.session!.secret,
            roomCode: ctx.room.constantRoomData.roomCode,
        });

        ctx.room.ws!.send(msg);
    };

    public static close: BotEventHandlerFn = (ctx) => {
        Logger.log({
            message: `Room ${ctx.room.constantRoomData.roomCode} socket closed.`,
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static attemptToReconnectOnClose: BotEventHandlerFn = (ctx) => {
        Logger.log({
            message: `Attempting to reconnect to ${ctx.room.constantRoomData.roomCode}...`,
            path: "CommonEventHandlers.class.ts",
        });

        Utilitary.initializeRoomSocket(ctx.bot.rawBot, ctx.room.rawRoom);
    };

    public static hello: BotEventHandlerFn = (ctx) => {
        Logger.error({
            message: "Message of type hello is send only, I should not receive it.",
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static getGamerModerationInfo: BotEventHandlerFn = (ctx) => {
        Logger.error({
            message: "Message of type getGamerModerationInfo is send only, I should not receive it.",
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static bye: BotEventHandlerFn = (ctx) => {
        const { reason } = ctx.bot.networkAdapter.readByeMessageData(ctx.message);
        Logger.log({
            message: `Room ${ctx.room.constantRoomData.roomCode} was forcefully disconnected by the server: ${reason}`,
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static chatRateLimited: BotEventHandlerFn = () => {
        Logger.log({
            message: "I got rate limited",
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static getGamerModerationInfoResult: BotEventHandlerFn = (ctx) => {
        const { gamerId, ipAddress } = ctx.bot.networkAdapter.readGetGamerModerationInfoResultData(ctx.message);
        Logger.log({
            message: `Event getGamerModerationInfoResult received for gamerId ${gamerId} with IP address ${ipAddress}`,
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static announce: BotEventHandlerFn = (ctx) => {
        const { message } = ctx.bot.networkAdapter.readAnnounceData(ctx.message);
        Logger.log({
            message: `Server announcement: ${message}`,
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static announceRestart: BotEventHandlerFn = (ctx) => {
        const { timeLeft } = ctx.bot.networkAdapter.readAnnounceRestartData(ctx.message);
        Logger.log({
            message: `Server announcement: Time left before restart: ${timeLeft}`,
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static debug: BotEventHandlerFn = () => {
        Logger.error({
            message: "Session message of type debug is send only, I should not receive it.",
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static start: BotEventHandlerFn = () => {
        Logger.error({
            message: "Session message of type start is send only, I should not receive it.",
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static abort: BotEventHandlerFn = () => {
        Logger.error({
            message: "Session message of type abort is send only, I should not receive it.",
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static updatePlaylistRatings: BotEventHandlerFn = (ctx) => {
        Logger.log({
            message: "Update playlist ratings received. We don't need to do anything with it yet.",
            path: "CommonEventHandlers.class.ts",
        });
    };
}
