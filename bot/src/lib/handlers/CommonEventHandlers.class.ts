import Logger from "../class/Logger.class";
import Utilitary from "../class/Utilitary.class";
import type { BotEventHandlerFn } from "../types/libEventTypes";

export class CommonEventHandlers {
    public static chatDisconnect: BotEventHandlerFn = (ctx) => {
        Logger.log({
            message: `Room ${ctx.room.constantRoomData.roomCode} chat socket disconnected.`,
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static gameDisconnect: BotEventHandlerFn = (ctx) => {
        Logger.log({
            message: `Room ${ctx.room.constantRoomData.roomCode} game socket disconnected.`,
            path: "CommonEventHandlers.class.ts",
        });
    };

    public static attemptToReconnectOnDisconnect: BotEventHandlerFn = (ctx) => {
        const room = ctx.room.rawRoom;
        const bot = ctx.bot.rawBot;
        if (!bot.rooms[room.id]) return;
        if (!room.hasEverConnected) {
            Logger.log({
                message: `Room ${room.constantRoomData.roomCode} never fully connected. Destroying.`,
                path: "CommonEventHandlers.class.ts",
            });
            Utilitary.destroyRoom(bot, room);
            return;
        }
        Logger.log({
            message: `Attempting to reconnect to ${room.constantRoomData.roomCode}...`,
            path: "CommonEventHandlers.class.ts",
        });
        Utilitary.destroyRoom(bot, room);
        bot.joinRoom({
            roomCode: room.constantRoomData.roomCode,
            targetConfig: room.constantRoomData.targetConfig,
            roomCreatorAuthId: room.constantRoomData.roomCreatorAuthId,
            userToken: room.constantRoomData.userToken,
            serverUrl: room.constantRoomData.serverUrl ?? undefined,
        });
    };
}
