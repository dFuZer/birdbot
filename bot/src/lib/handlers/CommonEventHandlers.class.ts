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
        console.log(`Room ${ctx.room.constantRoomData.roomCode} socket closed.`);
    };

    public static hello: BotEventHandlerFn = (ctx) => {
        console.error("Message of type hello is send only, I should not receive it.");
    };

    public static getGamerModerationInfo: BotEventHandlerFn = (ctx) => {
        console.error("Message of type getGamerModerationInfo is send only, I should not receive it.");
    };

    public static bye: BotEventHandlerFn = (ctx) => {
        const { reason } = ctx.bot.networkAdapter.readByeMessageData(ctx.message);
        console.info(`Room ${ctx.room.constantRoomData.roomCode} was forcefully disconnected by the server: ${reason}`);
    };

    public static chatRateLimited: BotEventHandlerFn = () => {
        console.log("I got rate limited");
    };

    public static getGamerModerationInfoResult: BotEventHandlerFn = (ctx) => {
        const { gamerId, ipAddress } = ctx.bot.networkAdapter.readGetGamerModerationInfoResultData(ctx.message);
        console.log(`Event getGamerModerationInfoResult received for gamerId ${gamerId} with IP address ${ipAddress}`);
    };

    public static announce: BotEventHandlerFn = (ctx) => {
        const { message } = ctx.bot.networkAdapter.readAnnounceData(ctx.message);
        console.log(`Server announcement: ${message}`);
    };

    public static announceRestart: BotEventHandlerFn = (ctx) => {
        const { timeLeft } = ctx.bot.networkAdapter.readAnnounceRestartData(ctx.message);
        console.log(`Server announcement: Time left before restart: ${timeLeft}`);
    };

    public static debug: BotEventHandlerFn = () => {
        console.error("Session message of type debug is send only, I should not receive it.");
    };

    public static start: BotEventHandlerFn = () => {
        console.error("Session message of type start is send only, I should not receive it.");
    };

    public static abort: BotEventHandlerFn = () => {
        console.error("Session message of type abort is send only, I should not receive it.");
    };

    public static updatePlaylistRatings: BotEventHandlerFn = (ctx) => {
        console.log(`Update playlist ratings received. We don't need to do anything with it yet.`);
    };
}
