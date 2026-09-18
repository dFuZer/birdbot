import assert from "node:assert/strict";
import test from "node:test";
import "../../../testEnv";
import Room from "../../../lib/class/Room.class";
import Utilitary from "../../../lib/class/Utilitary.class";
import type BirdBot from "../BirdBot.class";
import BirdBotLifecycle from "./BirdBotLifecycle.service";
import BirdBotRoomCheckpointService from "./BirdBotRoomCheckpoint.service";
import BirdBotApiWriteQueue from "./BirdBotApiWriteQueue.service";

function makeRoom(): Room {
    return new Room({
        roomCode: "KEEP",
        id: "keep-1",
        targetConfig: { dictionaryId: "en", isPublic: true, roomName: "keep" },
        roomCreatorAuthId: null,
        userToken: "token",
    });
}

test("graceful shutdown disconnects sockets without unpersisting rooms", async () => {
    const room = makeRoom();
    let destroyed = 0;
    const bot = {
        rooms: { [room.id]: room },
        acceptingTraffic: true,
        shuttingDown: false,
        stopServer: async () => undefined,
        clearPeriodicTasks: () => undefined,
        onRoomDestroyed: async () => {
            destroyed += 1;
        },
    } as unknown as BirdBot;

    const originalSaveAll = BirdBotRoomCheckpointService.saveAll;
    const originalDrain = BirdBotApiWriteQueue.drain;
    BirdBotRoomCheckpointService.saveAll = async () => undefined;
    BirdBotApiWriteQueue.drain = async () => 0;
    const originalDisconnect = Utilitary.disconnectRoomsForRestart;
    let disconnected = 0;
    Utilitary.disconnectRoomsForRestart = () => {
        disconnected += 1;
    };

    try {
        let exitCode: number | null = null;
        const lifecycle = new BirdBotLifecycle(bot, (code) => {
            exitCode = code;
        });
        await lifecycle.shutdown("SIGTERM");
        assert.equal(bot.shuttingDown, true);
        assert.equal(bot.acceptingTraffic, false);
        assert.equal(destroyed, 0);
        assert.equal(disconnected, 1);
        assert.equal(bot.rooms[room.id], room);
        assert.equal(exitCode, 0);
    } finally {
        BirdBotRoomCheckpointService.saveAll = originalSaveAll;
        BirdBotApiWriteQueue.drain = originalDrain;
        Utilitary.disconnectRoomsForRestart = originalDisconnect;
    }
});
