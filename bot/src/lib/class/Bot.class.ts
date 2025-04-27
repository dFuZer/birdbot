import WebSocket from "ws";
import type NetworkAdapter from "../abstract/NetworkAdapter.abstract.class";
import type { DictionaryId, GameMode } from "../types/gameTypes";
import type { BotEventHandler, BotEventHandlers, EventCtx } from "../types/libEventTypes";
import Logger from "./Logger.class";
import ResourceManager from "./ResourceManager.class";
import Room, { type RoomTargetConfig } from "./Room.class";
import { Session } from "./Session.class";
import Utilitary from "./Utilitary.class";

type BotData = {
    session: Session;
    adminAccountUsernames: string[];
};

type HandlerTask = {
    handler: BotEventHandler;
    ctx: EventCtx;
    eventName: string;
};

export default class Bot {
    public handlers: BotEventHandlers;
    public botData: BotData | null;
    public rooms: Record<string, Room>;
    public resourceManager: ResourceManager;
    public networkAdapter: NetworkAdapter;
    private handlerQueue: HandlerTask[];
    private isProcessingQueue: boolean;

    constructor({ handlers, networkAdapter }: { handlers: BotEventHandlers; networkAdapter: NetworkAdapter }) {
        this.handlers = handlers;
        this.botData = null;
        this.rooms = {};
        this.resourceManager = new ResourceManager();
        this.networkAdapter = networkAdapter;
        this.handlerQueue = [];
        this.isProcessingQueue = false;
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

    public enqueueHandler(task: HandlerTask) {
        this.handlerQueue.push(task);
        this.processHandlerQueue();
    }

    private async processHandlerQueue() {
        if (this.isProcessingQueue || this.handlerQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        const task = this.handlerQueue.shift();

        if (task) {
            Logger.log({
                message: `Executing handlers for event: ${task.eventName}`,
                path: "Bot.class.ts",
            });
            try {
                await Utilitary.executeEventHandlers(task.handler, task.ctx);
            } catch (error) {
                Logger.error({
                    message: `Error executing handlers for event ${task.eventName}:`,
                    path: "Bot.class.ts",
                    error,
                });
            } finally {
                this.isProcessingQueue = false;
                this.processHandlerQueue();
            }
        } else {
            this.isProcessingQueue = false;
        }
    }

    public async joinRoom({
        roomCode,
        targetConfig,
        roomCreatorUsername,
    }: {
        roomCode: string;
        targetConfig?: RoomTargetConfig;
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
        dictionaryId,
        gameMode,
        roomCreatorUsername,
    }: {
        dictionaryId: DictionaryId;
        gameMode: GameMode;
        roomCreatorUsername: string | null;
    }) {
        const ws = new WebSocket(`wss://croco.games/api/websocket`, {
            perMessageDeflate: false,
        });

        const onOpen = () => {
            let msg = this.networkAdapter.getCreateRoomMessage({
                dictionaryId,
                secret: this.botData!.session.session!.secret,
            });
            ws.send(msg);
        };

        const onMessage = (message: Buffer) => {
            const data = this.networkAdapter.readCentralMessageBaseData(message);
            if (data.eventType === "roomReady") {
                this.joinRoom({
                    roomCode: data.roomCode,
                    targetConfig: { dictionaryId, gameMode },
                    roomCreatorUsername: roomCreatorUsername,
                });
                ws.close();
            }
        };

        ws.on("open", onOpen);
        ws.on("message", onMessage);
    }
}
