import { createServer, type IncomingMessage, type ServerResponse } from "http";
import BirdBot from "./BirdBot.class";
import { dictionaryIdToBirdbotLanguage } from "./BirdBotConstants";
import { API_KEY } from "./BirdBotEnv";
import {
    BirdBotLanguage,
    BirdBotRoomMetadata,
    BirdBotSupportedDictionaryId,
} from "./BirdBotTypes";
import { t } from "./texts/BirdBotTextUtils";

function returnUnauthorized(res: ServerResponse) {
    res.writeHead(401, { "Content-Type": "text/plain" });
    res.write("Unauthorized");
    res.end();
}

function returnNotFound(res: ServerResponse) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.write("Not Found");
    res.end();
}

function birdBotServerHandler(
    req: IncomingMessage,
    res: ServerResponse,
    bot: BirdBot
) {
    const authorizationHeader = req.headers["authorization"];

    if (!authorizationHeader) {
        return returnUnauthorized(res);
    }

    const authToken = authorizationHeader.split(" ")[1];

    if (authToken !== API_KEY) {
        return returnUnauthorized(res);
    }

    const pathName = req.url;

    if (pathName === undefined) {
        return returnNotFound(res);
    }

    if (pathName === "/room-list") {
        type IRoom = {
            roomId: string;
            roomLanguage: BirdBotLanguage | "UNKNOWN";
            playerCount: number;
            gameTime: number | "NOT-IN-GAME";
            roomCode: string;
            roomName: string;
            wordCount: number;
        };

        const roomList = Object.entries(bot.rooms).map(([roomId, room]) => {
            const roomDictionaryId =
                room.roomState.gameData?.rules.dictionaryId;
            const roomLanguage =
                roomDictionaryId &&
                roomDictionaryId in dictionaryIdToBirdbotLanguage
                    ? dictionaryIdToBirdbotLanguage[
                          roomDictionaryId as BirdBotSupportedDictionaryId
                      ]
                    : "UNKNOWN";
            const playerCount = room.roomState.roomData?.gamers.length ?? 0;
            const gameTime =
                room.roomState.gameData?.step.value === "round"
                    ? Date.now() - room.roomState.gameData.step.timestamp
                    : "NOT-IN-GAME";
            const roomCode = room.constantRoomData.roomCode;

            const roomName = room.constantRoomData.roomCreatorUsername
                ? `${room.constantRoomData.roomCreatorUsername} x BirdBot 🐤`
                : `BirdBot ${t(`lib.language.${roomLanguage}.flag`)}`;

            const roomScoresByGamer = (
                room?.roomState?.metadata as BirdBotRoomMetadata
            )?.scoresByGamerId;

            const wordCount = roomScoresByGamer
                ? Object.values(roomScoresByGamer).reduce((acc, curr) => {
                      return acc + curr.words;
                  }, 0)
                : 0;

            return {
                roomId,
                roomLanguage,
                playerCount,
                gameTime,
                roomCode,
                roomName,
                wordCount,
            } satisfies IRoom;
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify(roomList));
        res.end();
    } else if (pathName === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.write("OK");
        res.end();
    } else {
        return returnNotFound(res);
    }
}

function getBirdBotHttpServer(bot: BirdBot) {
    return createServer((req, res) => {
        birdBotServerHandler(req, res, bot);
    });
}

export default getBirdBotHttpServer;
