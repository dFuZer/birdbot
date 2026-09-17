import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { z } from "zod";
import BirdBot from "./BirdBot.class";
import {
    birdbotLanguageToDictionaryId,
    dictionaryIdToBirdbotLanguage,
    languageEnumSchema,
    modesEnumSchema,
} from "./BirdBotConstants";
import { API_KEY } from "./BirdBotEnv";
import { BirdBotLanguage, BirdBotRoomMetadata, BirdBotSupportedDictionaryId } from "./BirdBotTypes";

function sendJson(res: ServerResponse, status: number, body: unknown) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.write(JSON.stringify(body));
    res.end();
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        length += buffer.length;
        if (length > 10_000) throw new Error("REQUEST_TOO_LARGE");
        chunks.push(buffer);
    }
    if (chunks.length === 0) return {};
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const createEphemeralRoomSchema = z.object({
    language: languageEnumSchema,
    mode: modesEnumSchema,
});

async function createEphemeralRoom(req: IncomingMessage, res: ServerResponse, bot: BirdBot) {
    let rawBody: unknown;
    try {
        rawBody = await readJsonBody(req);
    } catch (error) {
        const status = error instanceof Error && error.message === "REQUEST_TOO_LARGE" ? 413 : 400;
        return sendJson(res, status, { message: status === 413 ? "Request too large" : "Invalid JSON body" });
    }
    const body = createEphemeralRoomSchema.safeParse(rawBody);
    if (!body.success) return sendJson(res, 400, { message: "Invalid language or mode" });

    const result = await new Promise<{ type: "created"; roomCode: string } | { type: "limited" } | { type: "failed" }>(
        (resolve) => {
            void bot.createRoom({
                roomCreatorAuthId: null,
                targetConfig: {
                    dictionaryId: birdbotLanguageToDictionaryId[body.data.language],
                    birdbotGameMode: body.data.mode,
                    roomKind: "ephemeral",
                    ephemeralIdleSince: Date.now(),
                    isPublic: true,
                    roomName: "🐤 Temporary room",
                },
                callback: (roomCode) => resolve({ type: "created", roomCode }),
                limitCallback: () => resolve({ type: "limited" }),
                errorCallback: () => resolve({ type: "failed" }),
            });
        },
    );

    if (result.type === "limited") {
        return sendJson(res, 429, { message: `At most ${BirdBot.MAX_EPHEMERAL_ROOMS} temporary rooms may be active` });
    }
    if (result.type === "failed") return sendJson(res, 503, { message: "Room creation failed" });
    return sendJson(res, 201, { roomCode: result.roomCode });
}

async function birdBotServerHandler(req: IncomingMessage, res: ServerResponse, bot: BirdBot) {
    const authorizationHeader = req.headers["authorization"];

    if (!authorizationHeader) {
        return sendJson(res, 401, { message: "Unauthorized" });
    }

    const authToken = authorizationHeader.split(" ")[1];

    if (authToken !== API_KEY) {
        return sendJson(res, 401, { message: "Unauthorized" });
    }

    const pathName = req.url ? new URL(req.url, "http://localhost").pathname : undefined;
    if (pathName === undefined) return sendJson(res, 404, { message: "Not Found" });

    if (req.method === "GET" && pathName === "/room-list") {
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
            const roomDictionaryId = room.roomState.gameData?.rules.dictionaryId;
            const roomLanguage =
                roomDictionaryId && roomDictionaryId in dictionaryIdToBirdbotLanguage
                    ? dictionaryIdToBirdbotLanguage[roomDictionaryId as BirdBotSupportedDictionaryId]
                    : "UNKNOWN";
            const playerCount = room.roomState.roomData?.chatters.filter((x) => x.isOnline).length ?? 0;
            const gameTime =
                room.roomState.gameData?.milestone.name === "round"
                    ? Date.now() - room.roomState.roundStartTimestamp
                    : "NOT-IN-GAME";
            const roomCode = room.constantRoomData.roomCode;

            const roomName = room.constantRoomData.targetConfig.roomName;

            const roomScoresByPeer = (room?.roomState?.metadata as BirdBotRoomMetadata)?.scoresByPeerId;

            const wordCount = roomScoresByPeer
                ? Object.values(roomScoresByPeer).reduce((acc, curr) => {
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
    } else if (req.method === "POST" && pathName === "/rooms/ephemeral") {
        await createEphemeralRoom(req, res, bot);
    } else if (req.method === "GET" && pathName === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.write("OK");
        res.end();
    } else {
        return sendJson(res, 404, { message: "Not Found" });
    }
}

function getBirdBotHttpServer(bot: BirdBot) {
    return createServer((req, res) => {
        void birdBotServerHandler(req, res, bot).catch(() => {
            if (!res.headersSent) sendJson(res, 500, { message: "Internal server error" });
            else res.end();
        });
    });
}

export default getBirdBotHttpServer;
