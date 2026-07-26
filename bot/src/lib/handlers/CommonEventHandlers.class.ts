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
        if (bot.rooms[room.id] !== room) return;

        if (!room.hasEverConnected) {
            Logger.log({
                message: `Room ${room.constantRoomData.roomCode} never fully connected. Not reconnecting.`,
                path: "CommonEventHandlers.class.ts",
            });
            Utilitary.destroyRoom(bot, room);
            return;
        }
        void bot.reconnectRoom(room);
    };
}
