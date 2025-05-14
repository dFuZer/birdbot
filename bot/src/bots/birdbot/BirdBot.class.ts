import type AbstractNetworkAdapter from "../../lib/abstract/AbstractNetworkAdapter.class";
import Bot, { PeriodicTask } from "../../lib/class/Bot.class";
import birdbotEventHandlers from "./BirdBotEventHandlers";
import type { BirdBotLanguage, BirdbotRoomTargetConfig } from "./BirdBotTypes";

export default class BirdBot extends Bot {
    public creatingRoomQueue: string[];
    public mainRoomLanguages: BirdBotLanguage[];

    constructor({
        networkAdapter,
        periodicTasks,
        mainRoomLanguages,
    }: {
        networkAdapter: AbstractNetworkAdapter;
        periodicTasks?: PeriodicTask[];
        mainRoomLanguages: BirdBotLanguage[];
    }) {
        super({
            handlers: birdbotEventHandlers,
            networkAdapter,
            periodicTasks,
        });
        this.creatingRoomQueue = [];
        this.mainRoomLanguages = mainRoomLanguages;
    }

    public async createRoom({
        roomCreatorUsername,
        targetConfig,
        callback,
        errorCallback,
    }: {
        targetConfig: BirdbotRoomTargetConfig;
        roomCreatorUsername: string | null;
        callback?: (roomCode: string) => void;
        errorCallback?: () => void;
    }) {
        await super.createRoom({
            roomCreatorUsername,
            targetConfig,
            callback,
            errorCallback,
        });
    }
}
