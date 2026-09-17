import Bot, { PeriodicTask } from "../../lib/class/Bot.class";
import Logger from "../../lib/class/Logger.class";
import type Room from "../../lib/class/Room.class";
import birdbotEventHandlers from "./BirdBotEventHandlers";
import type { BirdBotLanguage, BirdbotRoomTargetConfig } from "./BirdBotTypes";
import BirdBotParityApiService from "./services/BirdBotParityApi.service";
import BirdBotStaffSync from "./services/BirdBotStaffSync.service";

export default class BirdBot extends Bot {
    public creatingRoomQueue: string[];
    public mainRoomLanguages: BirdBotLanguage[];
    private readonly creatingPermanentRoomDictionaryIds: Set<string>;

    constructor({
        periodicTasks,
        mainRoomLanguages,
    }: {
        periodicTasks?: PeriodicTask[];
        mainRoomLanguages: BirdBotLanguage[];
    }) {
        super({
            handlers: birdbotEventHandlers,
            periodicTasks,
        });
        this.creatingRoomQueue = [];
        this.mainRoomLanguages = mainRoomLanguages;
        this.creatingPermanentRoomDictionaryIds = new Set();
        this.onRoomConnected = (room) => this.persistRoom(room);
        this.onRoomDestroyed = (room) => this.unpersistRoom(room);
    }

    public async createRoom({
        roomCreatorAuthId,
        targetConfig,
        callback,
        errorCallback,
    }: {
        targetConfig: BirdbotRoomTargetConfig;
        roomCreatorAuthId: string | null;
        callback?: (roomCode: string) => void;
        errorCallback?: () => void;
    }) {
        const permanentRoomKey = targetConfig.dictionaryId;
        if (roomCreatorAuthId === null) {
            const existingRoom = Object.values(this.rooms).find(
                (room) =>
                    room.constantRoomData.roomCreatorAuthId === null &&
                    room.constantRoomData.targetConfig.dictionaryId === permanentRoomKey,
            );
            if (existingRoom || this.creatingPermanentRoomDictionaryIds.has(permanentRoomKey)) {
                if (existingRoom?.hasEverConnected) callback?.(existingRoom.constantRoomData.roomCode);
                return;
            }
            this.creatingPermanentRoomDictionaryIds.add(permanentRoomKey);
        }

        try {
            await super.createRoom({
                roomCreatorAuthId,
                targetConfig,
                callback,
                errorCallback,
            });
        } finally {
            if (roomCreatorAuthId === null) {
                this.creatingPermanentRoomDictionaryIds.delete(permanentRoomKey);
            }
        }
    }

    public async rejoinPersistedRooms(): Promise<void> {
        let rooms: Awaited<ReturnType<typeof BirdBotParityApiService.listBotRooms>> = [];
        try {
            rooms = await BirdBotParityApiService.listBotRooms();
        } catch (error) {
            Logger.error({
                message: "Failed to list persisted rooms for rejoin",
                path: "BirdBot.class.ts",
                error,
            });
            return;
        }

        for (const persisted of rooms) {
            const alreadyJoined = Object.values(this.rooms).some(
                (room) => room.constantRoomData.roomCode === persisted.roomCode,
            );
            if (alreadyJoined) continue;
            try {
                await this.joinRoom({
                    roomCode: persisted.roomCode,
                    targetConfig: persisted.targetConfig as BirdbotRoomTargetConfig,
                    roomCreatorAuthId: persisted.creatorAuthId,
                    userToken: persisted.userToken,
                    serverUrl: persisted.serverUrl ?? undefined,
                });
                if (!this.hasRoom(persisted.roomCode)) {
                    await this.dropPersistedRoom(persisted.roomCode, "rejoin completed but room is no longer held");
                }
            } catch (error) {
                Logger.error({
                    message: `Failed to rejoin persisted room ${persisted.roomCode}; removing from registry`,
                    path: "BirdBot.class.ts",
                    error,
                });
                await this.dropPersistedRoom(persisted.roomCode);
            }
        }
    }

    private hasRoom(roomCode: string): boolean {
        return Object.values(this.rooms).some((room) => room.constantRoomData.roomCode === roomCode);
    }

    private async persistRoom(room: Room): Promise<void> {
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
        await this.dropPersistedRoom(room.constantRoomData.roomCode);
    }

    private async dropPersistedRoom(roomCode: string, reason?: string): Promise<void> {
        try {
            await BirdBotParityApiService.deleteBotRoom(roomCode);
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
