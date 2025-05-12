import { type PeriodicTask } from "../../lib/class/Bot.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { BirdBotRoomMetadata } from "./BirdBotTypes";

export const birdbotPeriodicTasks: PeriodicTask[] = [
    {
        intervalInMs: 10000,
        timeout: undefined,
        fn: (ctx) => {
            const { bot } = ctx;
            for (const roomId in bot.rooms) {
                const room = bot.rooms[roomId];
                const hostName = room.constantRoomData.roomCreatorUsername;
                const roomMetadata = room.roomState
                    .metadata as BirdBotRoomMetadata;
                const gamers = room.roomState.roomData?.gamers;

                if (!room.ws || room.ws.readyState !== WebSocket.OPEN) continue;
                if (roomMetadata.hostLeftIteration === undefined) continue;
                if (gamers === undefined) continue;
                if (hostName === null) continue;

                const host = gamers.find(
                    (gamer) => gamer.identity.name === hostName
                );
                if (host === undefined) {
                    // Host left the room
                    roomMetadata.hostLeftIteration++;
                    if (roomMetadata.hostLeftIteration >= 6) {
                        // Host left the room for more than 6 iterations (60 seconds)
                        // We need to destroy the room
                        Utilitary.destroyRoom(bot, room);
                    }
                } else {
                    // Host is present, reset the counter
                    roomMetadata.hostLeftIteration = 0;
                }
            }
        },
    },
];
