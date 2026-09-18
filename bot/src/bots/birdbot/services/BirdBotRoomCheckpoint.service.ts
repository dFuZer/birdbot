import { mkdir, rename, rm, writeFile } from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import Logger from "../../../lib/class/Logger.class";
import type Room from "../../../lib/class/Room.class";
import { dataPath } from "../../../lib/paths";
import {
    type BirdBotGameMode,
    type BirdBotLanguage,
    type BirdBotPlaystyle,
    type BirdBotRoomMetadata,
    type BirdBotTrainingState,
    type GlobalGameScores,
    type PendingBirdBotWordRegistration,
    type PlayerGameScores,
} from "../BirdBotTypes";

export const CHECKPOINT_SCHEMA_VERSION = 1;

export type RoomCheckpointMetadata = {
    gameMode: BirdBotGameMode | "custom";
    gameplayLanguage: BirdBotLanguage;
    playstyle: BirdBotPlaystyle;
    training: BirdBotTrainingState | null;
    rankedBlockedUntilSeating: boolean;
    nextDelayMs: number;
    scoresByPeerId: Record<string, PlayerGameScores>;
    globalScores: GlobalGameScores;
    remainingSyllables: Record<string, number>;
    wasInitialized: boolean;
    hostLeftIteration: number;
    greetedPeerIds: string[];
    pendingWordRegistrations: [string, PendingBirdBotWordRegistration][];
    flipTurnKeys: string[];
    scoredWordTurnKeys: string[];
};

export type RoomCheckpoint = {
    schemaVersion: number;
    savedAt: number;
    roomCode: string;
    myPeerId: number;
    roundStartTimestamp: number;
    milestoneName: "round" | "seating" | null;
    wordHistory: string[];
    metadata: RoomCheckpointMetadata;
};

const EMPTY_GLOBAL_SCORES: GlobalGameScores = {
    flips: 0,
    depletedSyllables: 0,
    previousSyllables: 0,
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
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string");
}

export function serializeRoomCheckpoint(room: Room, savedAt = Date.now()): RoomCheckpoint | null {
    const roomCode = room.constantRoomData.roomCode;
    if (!roomCode) return null;
    const metadata = room.roomState.metadata as Partial<BirdBotRoomMetadata>;
    const milestoneName = room.roomState.gameData?.milestone.name ?? null;
    return {
        schemaVersion: CHECKPOINT_SCHEMA_VERSION,
        savedAt,
        roomCode,
        myPeerId: room.roomState.myPeerId,
        roundStartTimestamp: room.roomState.roundStartTimestamp,
        milestoneName,
        wordHistory: [...room.roomState.wordHistory],
        metadata: {
            gameMode: metadata.gameMode ?? "custom",
            gameplayLanguage: metadata.gameplayLanguage ?? "en",
            playstyle: metadata.playstyle ?? "regular",
            training: metadata.training ?? null,
            rankedBlockedUntilSeating: metadata.rankedBlockedUntilSeating ?? false,
            nextDelayMs: metadata.nextDelayMs ?? 0,
            scoresByPeerId: metadata.scoresByPeerId ?? {},
            globalScores: metadata.globalScores ?? { ...EMPTY_GLOBAL_SCORES },
            remainingSyllables: metadata.remainingSyllables ?? {},
            wasInitialized: metadata.wasInitialized ?? false,
            hostLeftIteration: metadata.hostLeftIteration ?? 0,
            greetedPeerIds: [...(metadata.greetedPeerIds ?? [])],
            pendingWordRegistrations: [...(metadata.pendingWordRegistrations ?? new Map())],
            flipTurnKeys: [...(metadata.flipTurnKeys ?? [])],
            scoredWordTurnKeys: [...(metadata.scoredWordTurnKeys ?? [])],
        },
    };
}

export function deserializeRoomCheckpoint(raw: unknown): RoomCheckpoint | null {
    if (!isRecord(raw)) return null;
    if (raw.schemaVersion !== CHECKPOINT_SCHEMA_VERSION) return null;
    if (typeof raw.roomCode !== "string" || raw.roomCode.length === 0) return null;
    if (typeof raw.savedAt !== "number" || typeof raw.myPeerId !== "number") return null;
    if (typeof raw.roundStartTimestamp !== "number") return null;
    if (raw.milestoneName !== "round" && raw.milestoneName !== "seating" && raw.milestoneName !== null) {
        return null;
    }
    if (!Array.isArray(raw.wordHistory) || !isRecord(raw.metadata)) return null;

    const metadata = raw.metadata;
    if (!isRecord(metadata.scoresByPeerId) || !isRecord(metadata.globalScores)) return null;
    if (!isRecord(metadata.remainingSyllables)) return null;
    if (typeof metadata.wasInitialized !== "boolean") return null;
    if (!Array.isArray(metadata.pendingWordRegistrations)) return null;

    const pendingWordRegistrations: [string, PendingBirdBotWordRegistration][] = [];
    for (const entry of metadata.pendingWordRegistrations) {
        if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || !isRecord(entry[1])) {
            return null;
        }
        pendingWordRegistrations.push([entry[0], entry[1] as unknown as PendingBirdBotWordRegistration]);
    }

    return {
        schemaVersion: CHECKPOINT_SCHEMA_VERSION,
        savedAt: raw.savedAt,
        roomCode: raw.roomCode,
        myPeerId: raw.myPeerId,
        roundStartTimestamp: raw.roundStartTimestamp,
        milestoneName: raw.milestoneName,
        wordHistory: asStringArray(raw.wordHistory),
        metadata: {
            gameMode: (metadata.gameMode as BirdBotGameMode | "custom") ?? "custom",
            gameplayLanguage: (metadata.gameplayLanguage as BirdBotLanguage) ?? "en",
            playstyle: (metadata.playstyle as BirdBotPlaystyle) ?? "regular",
            training: (metadata.training as BirdBotTrainingState | null) ?? null,
            rankedBlockedUntilSeating: Boolean(metadata.rankedBlockedUntilSeating),
            nextDelayMs: typeof metadata.nextDelayMs === "number" ? metadata.nextDelayMs : 0,
            scoresByPeerId: metadata.scoresByPeerId as Record<string, PlayerGameScores>,
            globalScores: metadata.globalScores as GlobalGameScores,
            remainingSyllables: metadata.remainingSyllables as Record<string, number>,
            wasInitialized: metadata.wasInitialized,
            hostLeftIteration: typeof metadata.hostLeftIteration === "number" ? metadata.hostLeftIteration : 0,
            greetedPeerIds: asStringArray(metadata.greetedPeerIds),
            pendingWordRegistrations,
            flipTurnKeys: asStringArray(metadata.flipTurnKeys),
            scoredWordTurnKeys: asStringArray(metadata.scoredWordTurnKeys),
        },
    };
}

export function applyRoomCheckpoint(room: Room, checkpoint: RoomCheckpoint): void {
    room.recoveredMyPeerId = checkpoint.myPeerId;
    room.checkpointMilestoneName = checkpoint.milestoneName;
    room.roomState.roundStartTimestamp = checkpoint.roundStartTimestamp;
    room.roomState.wordHistory = [...checkpoint.wordHistory];
    room.roomState.myPeerId = checkpoint.myPeerId;
    const metadata = room.roomState.metadata as BirdBotRoomMetadata;
    metadata.gameMode = checkpoint.metadata.gameMode;
    metadata.gameplayLanguage = checkpoint.metadata.gameplayLanguage;
    metadata.playstyle = checkpoint.metadata.playstyle;
    metadata.training = checkpoint.metadata.training;
    metadata.rankedBlockedUntilSeating = checkpoint.metadata.rankedBlockedUntilSeating;
    metadata.nextDelayMs = checkpoint.metadata.nextDelayMs;
    metadata.scoresByPeerId = { ...checkpoint.metadata.scoresByPeerId };
    metadata.globalScores = { ...checkpoint.metadata.globalScores };
    metadata.remainingSyllables = { ...checkpoint.metadata.remainingSyllables };
    metadata.wasInitialized = checkpoint.metadata.wasInitialized;
    metadata.hostLeftIteration = checkpoint.metadata.hostLeftIteration;
    metadata.greetedPeerIds = new Set(checkpoint.metadata.greetedPeerIds);
    metadata.pendingWordRegistrations = new Map(checkpoint.metadata.pendingWordRegistrations);
    metadata.flipTurnKeys = new Set(checkpoint.metadata.flipTurnKeys);
    metadata.scoredWordTurnKeys = new Set(checkpoint.metadata.scoredWordTurnKeys);
}

function checkpointFileName(roomCode: string): string {
    return `${roomCode.replace(/[^A-Za-z0-9_-]/g, "_")}.json`;
}

export default class BirdBotRoomCheckpointService {
    public static directoryOverride: string | null = null;

    public static directory(): string {
        return this.directoryOverride || process.env.BOT_STATE_DIR || path.join(dataPath, "room-checkpoints");
    }

    public static async saveRoom(room: Room): Promise<void> {
        const checkpoint = serializeRoomCheckpoint(room);
        if (!checkpoint) return;
        await this.writeCheckpoint(checkpoint);
    }

    public static async saveAll(rooms: Iterable<Room>): Promise<void> {
        for (const room of rooms) {
            try {
                await this.saveRoom(room);
            } catch (error) {
                Logger.error({
                    message: `Failed to checkpoint room ${room.constantRoomData.roomCode}`,
                    path: "BirdBotRoomCheckpoint.service.ts",
                    error,
                });
            }
        }
    }

    public static loadRoom(roomCode: string): RoomCheckpoint | null {
        const filePath = path.join(this.directory(), checkpointFileName(roomCode));
        try {
            const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
            const checkpoint = deserializeRoomCheckpoint(raw);
            if (!checkpoint || checkpoint.roomCode !== roomCode) return null;
            return checkpoint;
        } catch {
            return null;
        }
    }

    public static applyIfPresent(room: Room): RoomCheckpoint | null {
        const checkpoint = this.loadRoom(room.constantRoomData.roomCode);
        if (!checkpoint) return null;
        applyRoomCheckpoint(room, checkpoint);
        return checkpoint;
    }

    public static async remove(roomCode: string): Promise<void> {
        const filePath = path.join(this.directory(), checkpointFileName(roomCode));
        await rm(filePath, { force: true });
    }

    private static async writeCheckpoint(checkpoint: RoomCheckpoint): Promise<void> {
        const directory = this.directory();
        await mkdir(directory, { recursive: true });
        const filePath = path.join(directory, checkpointFileName(checkpoint.roomCode));
        const tempPath = `${filePath}.${process.pid}.tmp`;
        await writeFile(tempPath, JSON.stringify(checkpoint), "utf8");
        await rename(tempPath, filePath);
    }
}
