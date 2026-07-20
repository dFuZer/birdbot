import { type Server } from "http";
import type { BotEventHandlers } from "../types/libEventTypes";
import Logger from "./Logger.class";
import ResourceManager from "./ResourceManager.class";
import Room, { type RoomTargetConfig } from "./Room.class";
import { Session } from "./Session.class";
import Utilitary from "./Utilitary.class";

type BotData = {
    session: Session;
    adminAuthIds: string[];
};

export type PeriodicTaskCtx = {
    bot: Bot;
};

export type PeriodicTask = {
    intervalInMs: number;
    offsetInMs?: number;
    setIntervalTimeout: NodeJS.Timeout | undefined;
    setTimeoutTimeout: NodeJS.Timeout | undefined;
    fn: (ctx: PeriodicTaskCtx) => void;
};

export default class Bot {
    public periodicTasks: PeriodicTask[];
    public handlers: BotEventHandlers;
    public botData: BotData | null;
    public rooms: Record<string, Room>;
    public resourceManager: ResourceManager;
    public server?: {
        app: Server;
        port: number;
    };

    constructor({
        handlers,
        periodicTasks,
    }: {
        handlers: BotEventHandlers;
        periodicTasks?: PeriodicTask[];
    }) {
        this.handlers = handlers;
        this.botData = null;
        this.rooms = {};
        this.resourceManager = new ResourceManager();
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
            task.setTimeoutTimeout = setTimeout(() => {
                task.setIntervalTimeout = setInterval(() => {
                    task.fn({ bot: thisBot });
                }, task.intervalInMs);
            }, task.offsetInMs ?? 0);
        });
    }

    public clearPeriodicTasks() {
        this.periodicTasks.forEach((task) => {
            if (task.setIntervalTimeout) clearInterval(task.setIntervalTimeout);
            if (task.setTimeoutTimeout) clearTimeout(task.setTimeoutTimeout);
        });
    }

    public async init({ adminAuthIds }: { adminAuthIds: string[] }) {
        Logger.log({
            message: "Initializing bot",
            path: "Bot.class.ts",
        });
        const session = new Session();
        await session.init();
        this.botData = { session, adminAuthIds };
    }

    public async joinRoom({
        roomCode,
        targetConfig,
        roomCreatorAuthId,
        userToken,
        serverUrl,
    }: {
        roomCode: string;
        targetConfig: RoomTargetConfig;
        roomCreatorAuthId: string | null;
        userToken?: string;
        serverUrl?: string;
    }) {
        try {
            Logger.log({
                message: `Joining room ${roomCode}`,
                path: "Bot.class.ts",
            });
            const token = userToken ?? Utilitary.createUserToken();
            const randomUUID = Utilitary.randomUUID();
            const room = new Room({
                roomCode,
                id: randomUUID,
                targetConfig,
                roomCreatorAuthId,
                userToken: token,
                serverUrl: serverUrl ?? null,
            });

            await Utilitary.resolveRoomServerUrl(room);
            Utilitary.initializeRoomSockets(this, room);
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
        roomCreatorAuthId,
        targetConfig,
        callback,
        errorCallback,
    }: {
        targetConfig: RoomTargetConfig;
        roomCreatorAuthId: string | null;
        callback?: (roomCode: string) => void;
        errorCallback?: () => void;
    }) {
        const userToken = Utilitary.createUserToken();
        try {
            const response = await Utilitary.queuedPostJson<{ roomCode: string; url: string }>("/api/startRoom", {
                name: targetConfig.roomName,
                isPublic: targetConfig.isPublic,
                gameId: "bombparty",
                creatorUserToken: userToken,
            });

            if (!response.roomCode || !response.url) {
                errorCallback?.();
                return;
            }

            await this.joinRoom({
                roomCode: response.roomCode,
                targetConfig,
                roomCreatorAuthId,
                userToken,
                serverUrl: response.url,
            });
            callback?.(response.roomCode);
        } catch (error) {
            Logger.error({
                message: `Error creating room`,
                path: "Bot.class.ts",
                error,
            });
            errorCallback?.();
        }
    }
}
