import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import "../../../testEnv";
import Room from "../../../lib/class/Room.class";
import type { BirdBotRoomMetadata, PendingBirdBotWordRegistration } from "../BirdBotTypes";
import BirdBotRoomCheckpointService, {
    applyRoomCheckpoint,
    deserializeRoomCheckpoint,
    serializeRoomCheckpoint,
} from "./BirdBotRoomCheckpoint.service";

function makeRoom(): Room {
    const room = new Room({
        roomCode: "ABCD",
        id: "room-1",
        targetConfig: { dictionaryId: "en", isPublic: true, roomName: "test" },
        roomCreatorAuthId: "host",
        userToken: "token",
        serverUrl: "wss://example.test",
    });
    const pending: PendingBirdBotWordRegistration = {
        turnKey: "12:100",
        data: {
            word: "hello",
            submitResult: "success",
            prompt: "he",
            game: { id: "game-1", lang: "en", mode: "regular" },
            player: { accountName: "player", nickname: "Player" },
        },
    };
    room.roomState.myPeerId = 12;
    room.roomState.roundStartTimestamp = 1_700_000_000_000;
    room.roomState.wordHistory = ["alpha", "beta"];
    room.roomState.gameData = {
        rules: {
            dictionaryId: "en",
            minTurnDuration: 5,
            promptDifficulty: "custom",
            customPromptDifficulty: 1,
            maxPromptAge: 16,
            startingLives: 2,
            maxLives: 3,
            customBonusAlphabet: {},
        },
        dictionaryManifest: { bonusLetters: "abcdefghijklmnopqrstuvwxyz" },
        milestone: {
            name: "round",
            syllable: "he",
            currentPlayerPeerId: 12,
            playerStatesByPeerId: {},
            startTimestamp: 1_700_000_000_000,
        },
        players: [],
        leaderPeerId: 12,
        selfRoles: [],
    };
    room.roomState.metadata = {
        gameMode: "regular",
        gameplayLanguage: "en",
        playstyle: "alpha",
        training: { creatorAuthId: "host", list: null },
        rankedBlockedUntilSeating: false,
        nextDelayMs: 400,
        scoresByPeerId: {
            "12": {
                words: 3,
                flips: 1,
                depletedSyllables: 0,
                alpha: 2,
                currentWordsWithoutDeath: 3,
                maxWordsWithoutDeath: 3,
                previousSyllableScore: 1,
                previousSyllable: "he",
                multiSyllables: 0,
                hyphenWords: 0,
                moreThan20LettersWords: 0,
                slurs: 0,
                creatures: 0,
                ethnonyms: 0,
                chemicals: 0,
                plants: 0,
                foods: 0,
                adverbs: 0,
            },
        },
        globalScores: {
            flips: 1,
            depletedSyllables: 0,
            previousSyllables: 1,
            hyphenWords: 0,
            moreThan20LettersWords: 0,
            multiSyllables: 0,
            slurs: 0,
            creatures: 0,
            ethnonyms: 0,
            chemicals: 0,
            plants: 0,
            foods: 0,
            adverbs: 0,
        },
        remainingSyllables: { he: 4 },
        wasInitialized: true,
        hostLeftIteration: 2,
        greetedPeerIds: new Set(["12", "99"]),
        pendingWordRegistrations: new Map([["12:100", pending]]),
        flipTurnKeys: new Set(["12:100"]),
        scoredWordTurnKeys: new Set(["12:80", "99:81"]),
    } satisfies BirdBotRoomMetadata;
    return room;
}

test("serializeRoomCheckpoint round-trips Maps and Sets", () => {
    const room = makeRoom();
    const serialized = serializeRoomCheckpoint(room, 123);
    assert.ok(serialized);
    const deserialized = deserializeRoomCheckpoint(JSON.parse(JSON.stringify(serialized)));
    assert.ok(deserialized);
    const restored = new Room({
        roomCode: "ABCD",
        id: "room-2",
        targetConfig: { dictionaryId: "en", isPublic: true, roomName: "test" },
        roomCreatorAuthId: "host",
        userToken: "token",
    });
    applyRoomCheckpoint(restored, deserialized);

    const metadata = restored.roomState.metadata as BirdBotRoomMetadata;
    assert.equal(restored.recoveredMyPeerId, 12);
    assert.equal(restored.checkpointMilestoneName, "round");
    assert.deepEqual(restored.roomState.wordHistory, ["alpha", "beta"]);
    assert.equal(restored.roomState.roundStartTimestamp, 1_700_000_000_000);
    assert.equal(metadata.playstyle, "alpha");
    assert.equal(metadata.scoresByPeerId["12"]?.words, 3);
    assert.ok(metadata.greetedPeerIds instanceof Set);
    assert.ok(metadata.greetedPeerIds.has("99"));
    assert.ok(metadata.flipTurnKeys.has("12:100"));
    assert.ok(metadata.scoredWordTurnKeys.has("12:80"));
    assert.equal(metadata.pendingWordRegistrations.get("12:100")?.data.word, "hello");
    assert.equal(metadata.nextDelayMs, 400);
});

test("deserializeRoomCheckpoint discards incompatible schema versions", () => {
    const serialized = serializeRoomCheckpoint(makeRoom(), 123);
    assert.ok(serialized);
    serialized.schemaVersion = 999;
    assert.equal(deserializeRoomCheckpoint(serialized), null);
    assert.equal(deserializeRoomCheckpoint({ schemaVersion: 1 }), null);
});

test("checkpoint files are written atomically and loaded by room code", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "birdbot-checkpoint-"));
    const previous = BirdBotRoomCheckpointService.directoryOverride;
    BirdBotRoomCheckpointService.directoryOverride = directory;
    try {
        const room = makeRoom();
        await BirdBotRoomCheckpointService.saveRoom(room);
        const loaded = BirdBotRoomCheckpointService.loadRoom("ABCD");
        assert.ok(loaded);
        assert.equal(loaded.roomCode, "ABCD");
        assert.equal(loaded.metadata.scoresByPeerId["12"]?.alpha, 2);
        await BirdBotRoomCheckpointService.remove("ABCD");
        assert.equal(BirdBotRoomCheckpointService.loadRoom("ABCD"), null);
    } finally {
        BirdBotRoomCheckpointService.directoryOverride = previous;
        await rm(directory, { recursive: true, force: true });
    }
});
