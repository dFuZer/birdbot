import { type PeriodicTask } from "../../lib/class/Bot.class";

export const birdbotPeriodicTasks: PeriodicTask[] = [
    // {
    //     intervalInMs: 5000,
    //     timeout: undefined,
    //     fn: (ctx) => {
    //         const { bot } = ctx;
    //         for (const roomId in bot.rooms) {
    //             const room = bot.rooms[roomId];
    //             if (!room.ws || room.ws.readyState !== WebSocket.OPEN) continue;
    //             const msg = bot.networkAdapter.getSendChatMessage(`Test`);
    //             room.ws.send(msg);
    //         }
    //     },
    // },
];
