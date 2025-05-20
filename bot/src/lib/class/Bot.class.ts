import { type Server } from "http";
import WebSocket from "ws";
import type AbstractNetworkAdapter from "../abstract/AbstractNetworkAdapter.class";
import { crocoDomain } from "../constants/gameConstants";
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

export type PeriodicTaskCtx = {
    bot: Bot;
};

export type PeriodicTask = {
    intervalInMs: number;
    timeout: NodeJS.Timeout | undefined;
    fn: (ctx: PeriodicTaskCtx) => void;
};

export default class Bot {
    public periodicTasks: PeriodicTask[];
    public handlers: BotEventHandlers;
    public botData: BotData | null;
    public rooms: Record<string, Room>;
    public resourceManager: ResourceManager;
    public networkAdapter: AbstractNetworkAdapter;
    public server?: {
        app: Server;
        port: number;
    };

    constructor({
        handlers,
        networkAdapter,
        periodicTasks,
    }: {
        handlers: BotEventHandlers;
        networkAdapter: AbstractNetworkAdapter;
        periodicTasks?: PeriodicTask[];
    }) {
        this.handlers = handlers;
        this.botData = null;
        this.rooms = {};
        this.resourceManager = new ResourceManager();
        this.networkAdapter = networkAdapter;
        this.periodicTasks = periodicTasks ?? [];
    }

    public initServer(serverConfig: { port: number; app: Server }) {
        this.server = serverConfig;
    }

    public startServer() {
        const server = this.server;
        if (server) {
            server.app.listen(server.port, () => {
                Logger.log({
                    message: `Server started on port ${server.port}`,
                    path: "Bot.class.ts",
                });
            });
        }
    }

    public startPeriodicTasks() {
        const thisBot = this;
        thisBot.periodicTasks.forEach((task) => {
            task.timeout = setInterval(() => {
                task.fn({ bot: thisBot });
            }, task.intervalInMs);
        });
    }

    public clearPeriodicTasks() {
        this.periodicTasks.forEach((task) => {
            if (task.timeout) clearInterval(task.timeout);
        });
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
            const room = new Room({
                roomCode,
                id: randomUUID,
                targetConfig,
                roomCreatorUsername,
            });

            await room.init({
                sessionSecret: this.botData!.session.session!.secret,
            });
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
        errorCallback,
    }: {
        targetConfig: RoomTargetConfig;
        roomCreatorUsername: string | null;
        callback?: (roomCode: string) => void;
        errorCallback?: () => void;
    }) {
        let ws: WebSocket = new WebSocket(`wss://${crocoDomain}/api/websocket`, {
            perMessageDeflate: false,
        });

        const onOpen = () => {
            let msg = this.networkAdapter.getCreateRoomMessage({
                dictionaryId: targetConfig.dictionaryId,
                secret: this.botData!.session.session!.secret,
                isPublic: targetConfig.isPublic,
                roomName: targetConfig.roomName,
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
            } else if (data.eventType === "bye") {
                errorCallback?.();

                // The bye message may indicate that the session is not valid anymore.
                Logger.log({
                    message: "Session may be invalid. Trying to reinitialize it.",
                    path: "Bot.class.ts",
                });
                this.botData?.session.init();
            }
        };

        ws.on("open", onOpen);
        ws.on("message", onMessage);
        ws.on("error", (error) => {
            Logger.error({
                message: `Error creating room websocket.`,
                path: "Bot.class.ts",
                error,
            });
            errorCallback?.();
        });
    }
}
