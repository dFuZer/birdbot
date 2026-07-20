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

        const snapshot = {
            roomCode: room.constantRoomData.roomCode,
            targetConfig: room.constantRoomData.targetConfig,
            roomCreatorAuthId: room.constantRoomData.roomCreatorAuthId,
            userToken: room.constantRoomData.userToken,
            serverUrl: room.constantRoomData.serverUrl,
            hasEverConnected: room.hasEverConnected,
        };

        Utilitary.destroyRoom(bot, room);

        if (!snapshot.hasEverConnected) {
            Logger.log({
                message: `Room ${snapshot.roomCode} never fully connected. Not reconnecting.`,
                path: "CommonEventHandlers.class.ts",
            });
            return;
        }

        Logger.log({
            message: `Attempting to reconnect to ${snapshot.roomCode}...`,
            path: "CommonEventHandlers.class.ts",
        });
        bot.joinRoom({
            roomCode: snapshot.roomCode,
            targetConfig: snapshot.targetConfig,
            roomCreatorAuthId: snapshot.roomCreatorAuthId,
            userToken: snapshot.userToken,
            serverUrl: snapshot.serverUrl ?? undefined,
        });
    };
}
