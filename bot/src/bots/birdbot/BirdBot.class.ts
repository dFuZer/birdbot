import type AbstractNetworkAdapter from "../../lib/abstract/AbstractNetworkAdapter.class";
import Bot, { PeriodicTask } from "../../lib/class/Bot.class";
import birdbotEventHandlers from "./BirdBotEventHandlers";
import type { BirdbotRoomTargetConfig } from "./BirdBotTypes";

export default class BirdBot extends Bot {
    public creatingRoomQueue: string[];

    constructor({
        networkAdapter,
        periodicTasks,
    }: {
        networkAdapter: AbstractNetworkAdapter;
        periodicTasks?: PeriodicTask[];
    }) {
        super({
            handlers: birdbotEventHandlers,
            networkAdapter,
            periodicTasks,
        });
        this.creatingRoomQueue = [];
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
