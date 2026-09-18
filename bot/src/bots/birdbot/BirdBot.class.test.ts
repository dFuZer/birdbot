import assert from "node:assert/strict";
import test from "node:test";
import "../../testEnv";
import Room from "../../lib/class/Room.class";
import BirdBot from "./BirdBot.class";
import BirdBotParityApiService, { type BirdBotPersistedRoom } from "./services/BirdBotParityApi.service";
import BirdBotRoomCheckpointService from "./services/BirdBotRoomCheckpoint.service";

function persisted(roomCode: string): BirdBotPersistedRoom {
    return {
        roomCode,
        userToken: "token",
        serverUrl: "https://example.invalid",
        creatorAuthId: null,
        targetConfig: { dictionaryId: "en", isPublic: true, roomName: roomCode },
    };
}

async function withRecoveryStubs(run: (bot: BirdBot) => Promise<void>): Promise<void> {
    const bot = new BirdBot({ mainRoomLanguages: ["en"] });
    const originalDelays = BirdBot.recoveryRetryDelaysMs;
    const originalList = BirdBotParityApiService.listBotRooms;
    const originalDelete = BirdBotParityApiService.deleteBotRoom;
    const originalRemove = BirdBotRoomCheckpointService.remove;
    BirdBot.recoveryRetryDelaysMs = [];
    BirdBotRoomCheckpointService.remove = async () => undefined;

    try {
        await run(bot);
    } finally {
        BirdBot.recoveryRetryDelaysMs = originalDelays;
        BirdBotParityApiService.listBotRooms = originalList;
        BirdBotParityApiService.deleteBotRoom = originalDelete;
        BirdBotRoomCheckpointService.remove = originalRemove;
    }
}

test("rejoinPersistedRooms drops the whole queue if the first room cannot be recovered", async () => {
    await withRecoveryStubs(async (bot) => {
        const joined: string[] = [];
        const deleted: string[] = [];
        BirdBotParityApiService.listBotRooms = async () => [persisted("AAAA"), persisted("BBBB"), persisted("CCCC")];
        BirdBotParityApiService.deleteBotRoom = async (roomCode) => {
            deleted.push(roomCode);
        };
        bot.joinRoom = async ({ roomCode }) => {
            joined.push(roomCode);
            throw new Error("join failed");
        };

        await bot.rejoinPersistedRooms();

        assert.deepEqual(joined, ["AAAA"]);
        assert.deepEqual(deleted.sort(), ["AAAA", "BBBB", "CCCC"]);
        assert.equal(Object.keys(bot.rooms).length, 0);
    });
});

test("rejoinPersistedRooms keeps recovering later rooms when the first join succeeds", async () => {
    await withRecoveryStubs(async (bot) => {
        const joined: string[] = [];
        const deleted: string[] = [];
        BirdBotParityApiService.listBotRooms = async () => [persisted("AAAA"), persisted("BBBB"), persisted("CCCC")];
        BirdBotParityApiService.deleteBotRoom = async (roomCode) => {
            deleted.push(roomCode);
        };
        bot.joinRoom = async ({ roomCode }) => {
            joined.push(roomCode);
            if (roomCode === "BBBB") throw new Error("join failed");
            const room = new Room({
                roomCode,
                id: roomCode,
                targetConfig: { dictionaryId: "en", isPublic: true, roomName: roomCode },
                roomCreatorAuthId: null,
                userToken: "token",
            });
            bot.rooms[room.id] = room;
            return room;
        };

        await bot.rejoinPersistedRooms();

        assert.deepEqual(joined.sort(), ["AAAA", "BBBB", "CCCC"]);
        assert.deepEqual(deleted, []);
        assert.ok(bot.rooms["AAAA"]);
        assert.ok(bot.rooms["CCCC"]);
        assert.equal(bot.rooms["BBBB"], undefined);
    });
});
