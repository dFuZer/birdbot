import WebSocket from "ws";
import type NetworkAdapter from "../abstract/NetworkAdapter.abstract.class";
import type { BotEventHandlers } from "../types/libEventTypes";
import Logger from "./Logger.class";
import ResourceManager from "./ResourceManager.class";
import Room, { type RoomTargetConfig } from "./Room.class";
import { Session } from "./Session.class";
import Utilitary from "./Utilitary.class";

type BotData = {
    session: Session;
    adminAccountUsernames: string[];
};

export default class Bot {
    public handlers: BotEventHandlers;
    public botData: BotData | null;
    public rooms: Record<string, Room>;
    public resourceManager: ResourceManager;
    public networkAdapter: NetworkAdapter;

    constructor({ handlers, networkAdapter }: { handlers: BotEventHandlers; networkAdapter: NetworkAdapter }) {
        this.handlers = handlers;
        this.botData = null;
        this.rooms = {};
        this.resourceManager = new ResourceManager();
        this.networkAdapter = networkAdapter;
    }

    public async init({ adminAccountUsernames }: { adminAccountUsernames: string[] }) {
        Logger.log({
            message: "Initializing bot",
            path: "Bot.class.ts",
        });
        const session = new Session();
        await session.init();
        this.botData = { session, adminAccountUsernames };
    }

    public async joinRoom({
        roomCode,
        targetConfig,
        roomCreatorUsername,
    }: {
        roomCode: string;
        targetConfig: RoomTargetConfig;
        roomCreatorUsername: string | null;
    }) {
        try {
            Logger.log({
                message: `Joining room ${roomCode}`,
                path: "Bot.class.ts",
            });
            const randomUUID = Utilitary.randomUUID();
            const room = new Room({ roomCode, id: randomUUID, targetConfig, roomCreatorUsername });

            await room.init({ sessionSecret: this.botData!.session.session!.secret });
            Utilitary.initializeRoomSocket(this, room);

            this.rooms[randomUUID] = room;
        } catch (error) {
            Logger.error({
                message: `Error joining room ${roomCode}:`,
                path: "Bot.class.ts",
                error,
            });
        }
    }

    public async createRoom({
        roomCreatorUsername,
        targetConfig,
        callback,
    }: {
        targetConfig: RoomTargetConfig;
        roomCreatorUsername: string | null;
        callback?: (roomCode: string) => void;
    }) {
        const ws = new WebSocket(`wss://croco.games/api/websocket`, {
            perMessageDeflate: false,
        });

        const onOpen = () => {
            let msg = this.networkAdapter.getCreateRoomMessage({
                dictionaryId: targetConfig.dictionaryId,
                secret: this.botData!.session.session!.secret,
            });
            ws.send(msg);
        };

        const onMessage = (message: Buffer) => {
            const data = this.networkAdapter.readCentralMessageBaseData(message);
            if (data.eventType === "roomReady") {
                this.joinRoom({
                    roomCode: data.roomCode,
                    targetConfig,
                    roomCreatorUsername: roomCreatorUsername,
                });
                ws.close();
                callback?.(data.roomCode);
            }
        };

        ws.on("open", onOpen);
        ws.on("message", onMessage);
    }
}
