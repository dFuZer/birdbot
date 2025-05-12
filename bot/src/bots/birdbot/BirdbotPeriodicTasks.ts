import { type PeriodicTask } from "../../lib/class/Bot.class";
import Logger from "../../lib/class/Logger.class";
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
        const roomMetadata = room.roomState.metadata as BirdBotRoomMetadata;
        const gamers = room.roomState.roomData?.gamers;

        if (!room.ws || room.ws.readyState !== WebSocket.OPEN) {
          Logger.log({
            message: "Room socket is not open, skipping",
            path: "BirdbotPeriodicTasks.ts",
          });
          continue;
        }
        if (roomMetadata.hostLeftIteration === undefined) {
          Logger.log({
            message: "Room metadata is not initialized, skipping",
            path: "BirdbotPeriodicTasks.ts",
          });
          continue;
        }
        if (gamers === undefined) {
          Logger.log({
            message: "Gamers are not initialized, skipping",
            path: "BirdbotPeriodicTasks.ts",
          });
          continue;
        }
        if (hostName === null) {
          Logger.log({
            message: "Room is main, skipping",
            path: "BirdbotPeriodicTasks.ts",
          });
          continue;
        }

        const host = gamers.find((gamer) => gamer.identity.name === hostName);
        if (host === undefined) {
          // Host left the room
          roomMetadata.hostLeftIteration++;
          Logger.log({
            message: "Host left the room",
            path: "BirdbotPeriodicTasks.ts",
          });
          if (roomMetadata.hostLeftIteration >= 6) {
            // Host left the room for more than 6 iterations
            // We need to destroy the room
            Utilitary.destroyRoom(bot, room);
            Logger.log({
              message: "Room destroyed because host left",
              path: "BirdbotPeriodicTasks.ts",
            });
          }
        } else {
          // Host is present
          Logger.log({
            message: "Host is present",
            path: "BirdbotPeriodicTasks.ts",
          });
          roomMetadata.hostLeftIteration = 0;
        }
      }
    },
  },
];
