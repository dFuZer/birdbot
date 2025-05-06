import type NetworkAdapter from "../../lib/abstract/NetworkAdapter.abstract.class";
import Bot, { PeriodicTask } from "../../lib/class/Bot.class";
import birdbotEventHandlers from "./BirdBotEventHandlers";
import type { BirdbotRoomTargetConfig } from "./BirdBotTypes";
export default class BirdBot extends Bot {
    constructor({ networkAdapter, periodicTasks }: { networkAdapter: NetworkAdapter; periodicTasks?: PeriodicTask[] }) {
        super({ handlers: birdbotEventHandlers, networkAdapter, periodicTasks });
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
        super.createRoom({
            roomCreatorUsername,
            targetConfig,
            callback,
        });
    }
}
