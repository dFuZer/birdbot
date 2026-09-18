import Bot, { PeriodicTask } from "../../lib/class/Bot.class";
import Logger from "../../lib/class/Logger.class";
import type Room from "../../lib/class/Room.class";
import birdbotEventHandlers from "./BirdBotEventHandlers";
import { type BirdBotLanguage, type BirdbotRoomTargetConfig, getBirdBotRoomKind } from "./BirdBotTypes";
import BirdBotParityApiService, { type BirdBotPersistedRoom } from "./services/BirdBotParityApi.service";
import BirdBotRoomCheckpointService from "./services/BirdBotRoomCheckpoint.service";
import { mapWithConcurrency, retryWithBackoff } from "./services/BirdBotRecovery.service";
import BirdBotStaffSync from "./services/BirdBotStaffSync.service";

export default class BirdBot extends Bot {
    public static readonly MAX_EPHEMERAL_ROOMS = 15;
    public static recoveryRetryDelaysMs = [1000, 2000, 4000];

    public creatingRoomQueue: string[];
    public mainRoomLanguages: BirdBotLanguage[];
    private readonly creatingPermanentRoomDictionaryIds: Set<string>;
    private creatingEphemeralRoomCount: number;
    private readonly roomPersistenceQueues: Map<string, Promise<void>>;

    constructor({ periodicTasks, mainRoomLanguages }: { periodicTasks?: PeriodicTask[]; mainRoomLanguages: BirdBotLanguage[] }) {
        super({
            handlers: birdbotEventHandlers,
            periodicTasks,
        });
        this.creatingRoomQueue = [];
        this.mainRoomLanguages = mainRoomLanguages;
        this.creatingPermanentRoomDictionaryIds = new Set();
        this.creatingEphemeralRoomCount = 0;
        this.roomPersistenceQueues = new Map();
        this.onRoomConnected = (room) => this.persistRoom(room);
        this.onRoomDestroyed = (room) => this.unpersistRoom(room);
        this.restoreRoomCheckpoint = (room) => {
            const checkpoint = BirdBotRoomCheckpointService.applyIfPresent(room);
            if (checkpoint) {
                Logger.log({
                    message: `Restored checkpoint for room ${room.constantRoomData.roomCode}`,
                    path: "BirdBot.class.ts",
                });
            }
        };
    }

    public async createRoom({
        roomCreatorAuthId,
        targetConfig,
        callback,
        errorCallback,
        limitCallback,
    }: {
        targetConfig: BirdbotRoomTargetConfig;
        roomCreatorAuthId: string | null;
        callback?: (roomCode: string) => void;
        errorCallback?: () => void;
        limitCallback?: () => void;
    }) {
        const roomKind = getBirdBotRoomKind(targetConfig, roomCreatorAuthId);
        targetConfig.roomKind = roomKind;
        const permanentRoomKey = targetConfig.dictionaryId;
        if (roomKind === "main") {
            const existingRoom = Object.values(this.rooms).find(
                (room) =>
                    getBirdBotRoomKind(room.constantRoomData.targetConfig, room.constantRoomData.roomCreatorAuthId) === "main" &&
                    room.constantRoomData.targetConfig.dictionaryId === permanentRoomKey,
            );
            if (existingRoom || this.creatingPermanentRoomDictionaryIds.has(permanentRoomKey)) {
                if (existingRoom?.hasEverConnected) callback?.(existingRoom.constantRoomData.roomCode);
                return;
            }
            this.creatingPermanentRoomDictionaryIds.add(permanentRoomKey);
        }
        if (roomKind === "ephemeral") {
            if (this.getEphemeralRoomCount() + this.creatingEphemeralRoomCount >= BirdBot.MAX_EPHEMERAL_ROOMS) {
                limitCallback?.();
                return;
            }
            this.creatingEphemeralRoomCount++;
        }

        try {
            await super.createRoom({
                roomCreatorAuthId,
                targetConfig,
                callback,
                errorCallback,
            });
        } finally {
            if (roomKind === "main") {
                this.creatingPermanentRoomDictionaryIds.delete(permanentRoomKey);
            }
            if (roomKind === "ephemeral") {
                this.creatingEphemeralRoomCount--;
            }
        }
    }

    public getEphemeralRoomCount(): number {
        return Object.values(this.rooms).filter(
            (room) =>
                getBirdBotRoomKind(room.constantRoomData.targetConfig, room.constantRoomData.roomCreatorAuthId) === "ephemeral",
        ).length;
    }

    public setEphemeralIdleSince(room: Room, idleSince: number | null): void {
        const targetConfig = room.constantRoomData.targetConfig as BirdbotRoomTargetConfig;
        if (getBirdBotRoomKind(targetConfig, room.constantRoomData.roomCreatorAuthId) !== "ephemeral") return;
        if (targetConfig.ephemeralIdleSince === idleSince) return;
        targetConfig.ephemeralIdleSince = idleSince;
        void this.persistRoom(room);
    }

    public async rejoinPersistedRooms(): Promise<void> {
        let rooms: BirdBotPersistedRoom[] = [];
        try {
            rooms = await retryWithBackoff(() => BirdBotParityApiService.listBotRooms(), BirdBot.recoveryRetryDelaysMs);
        } catch (error) {
            Logger.error({
                message: "Failed to list persisted rooms for rejoin",
                path: "BirdBot.class.ts",
                error,
            });
            return;
        }

        if (rooms.length === 0) return;

        const first = rooms[0]!;
        const remaining = rooms.slice(1);
        const firstRecovered = await this.recoverPersistedRoom(first);
        if (!firstRecovered) {
            Logger.warn({
                message: `Failed to recover first room ${first.roomCode}; flushing ${remaining.length} remaining recoveries permanently`,
                path: "BirdBot.class.ts",
            });
            await this.dropPersistedRooms(
                rooms.map((room) => room.roomCode),
                "first recovery failed; flushing recovery queue",
            );
            return;
        }

        await mapWithConcurrency(remaining, 4, async (persisted) => {
            const recovered = await this.recoverPersistedRoom(persisted);
            if (!recovered) {
                Logger.error({
                    message: `Failed to rejoin persisted room ${persisted.roomCode}; leaving it in the registry for a later retry`,
                    path: "BirdBot.class.ts",
                });
            }
        });
    }

    private async recoverPersistedRoom(persisted: BirdBotPersistedRoom): Promise<boolean> {
        if (this.hasRoom(persisted.roomCode)) return true;
        try {
            const targetConfig = persisted.targetConfig as BirdbotRoomTargetConfig;
            targetConfig.roomKind = getBirdBotRoomKind(targetConfig, persisted.creatorAuthId);
            await retryWithBackoff(
                async () => {
                    await this.joinRoom({
                        roomCode: persisted.roomCode,
                        targetConfig,
                        roomCreatorAuthId: persisted.creatorAuthId,
                        userToken: persisted.userToken,
                        serverUrl: persisted.serverUrl ?? undefined,
                        recovery: true,
                    });
                    if (!this.hasRoom(persisted.roomCode)) {
                        throw new Error("rejoin completed but room is no longer held");
                    }
                },
                BirdBot.recoveryRetryDelaysMs,
            );
            return true;
        } catch (error) {
            Logger.error({
                message: `Failed to rejoin persisted room ${persisted.roomCode}`,
                path: "BirdBot.class.ts",
                error,
            });
            return false;
        }
    }

    private hasRoom(roomCode: string): boolean {
        return Object.values(this.rooms).some((room) => room.constantRoomData.roomCode === roomCode);
    }

    public async persistRoom(room: Room): Promise<void> {
        const roomCode = room.constantRoomData.roomCode;
        const previousWrite = this.roomPersistenceQueues.get(roomCode) ?? Promise.resolve();
        const nextWrite = previousWrite.then(() => this.persistRoomNow(room));
        this.roomPersistenceQueues.set(roomCode, nextWrite);
        await nextWrite.finally(() => {
            if (this.roomPersistenceQueues.get(roomCode) === nextWrite) {
                this.roomPersistenceQueues.delete(roomCode);
            }
        });
    }

    private async persistRoomNow(room: Room): Promise<void> {
        try {
            await BirdBotParityApiService.upsertBotRoom({
                roomCode: room.constantRoomData.roomCode,
                userToken: room.constantRoomData.userToken,
                serverUrl: room.constantRoomData.serverUrl,
                creatorAuthId: room.constantRoomData.roomCreatorAuthId,
                targetConfig: room.constantRoomData.targetConfig as Record<string, unknown>,
            });
        } catch (error) {
            Logger.error({
                message: `Failed to persist room ${room.constantRoomData.roomCode}`,
                path: "BirdBot.class.ts",
                error,
            });
        }
    }

    private async unpersistRoom(room: Room): Promise<void> {
        await this.roomPersistenceQueues.get(room.constantRoomData.roomCode);
        await this.dropPersistedRoom(room.constantRoomData.roomCode);
    }

    private async dropPersistedRooms(roomCodes: string[], reason: string): Promise<void> {
        await Promise.all(roomCodes.map((roomCode) => this.dropPersistedRoom(roomCode, reason)));
    }

    private async dropPersistedRoom(roomCode: string, reason?: string): Promise<void> {
        try {
            await BirdBotParityApiService.deleteBotRoom(roomCode);
            await BirdBotRoomCheckpointService.remove(roomCode);
            if (reason) {
                Logger.log({
                    message: `Removed persisted room ${roomCode}: ${reason}`,
                    path: "BirdBot.class.ts",
                });
            }
        } catch (error) {
            Logger.error({
                message: `Failed to unpersist room ${roomCode}`,
                path: "BirdBot.class.ts",
                error,
            });
        }
    }
}

export { BirdBotStaffSync };
