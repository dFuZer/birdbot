import type AbstractNetworkAdapter from "../../lib/abstract/AbstractNetworkAdapter.class";
import Bot, { PeriodicTask } from "../../lib/class/Bot.class";
import birdbotEventHandlers from "./BirdBotEventHandlers";
import type { BirdbotRoomTargetConfig } from "./BirdBotTypes";
export default class BirdBot extends Bot {
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
    }

    public async createRoom({
        roomCreatorUsername,
        targetConfig,
        callback,
    }: {
        targetConfig: BirdbotRoomTargetConfig;
        roomCreatorUsername: string | null;
        callback?: (roomCode: string) => void;
    }) {
        await super.createRoom({
            roomCreatorUsername,
            targetConfig,
            callback,
        });
    }
}
