import Bot, { PeriodicTask } from "../../lib/class/Bot.class";
import birdbotEventHandlers from "./BirdBotEventHandlers";
import type { BirdBotLanguage, BirdbotRoomTargetConfig } from "./BirdBotTypes";

export default class BirdBot extends Bot {
    public creatingRoomQueue: string[];
    public mainRoomLanguages: BirdBotLanguage[];

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
        await super.createRoom({
            roomCreatorAuthId,
            targetConfig,
            callback,
            errorCallback,
        });
    }
}
