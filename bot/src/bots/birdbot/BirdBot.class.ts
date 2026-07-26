import Bot, { PeriodicTask } from "../../lib/class/Bot.class";
import birdbotEventHandlers from "./BirdBotEventHandlers";
import type { BirdBotLanguage, BirdbotRoomTargetConfig } from "./BirdBotTypes";

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
                    room.constantRoomData.targetConfig.dictionaryId === permanentRoomKey
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
}
