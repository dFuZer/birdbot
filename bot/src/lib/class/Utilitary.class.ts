import { randomUUID } from "crypto";
import fs, { createReadStream, readFileSync } from "fs";
import path from "path";
import readline from "readline";
import { io, type Socket } from "socket.io-client";
import { v5 as uuidv5 } from "uuid";
import { jklmDomain } from "../constants/gameConstants";
import { NAMESPACE_UUID } from "../env";
import { dataPath } from "../paths";
import type { Chatter, GameData, MilestoneRound } from "../types/gameTypes";
import type { BotEventHandler, BotEventPreviousHandlersCtx, EventCtx } from "../types/libEventTypes";
import type Bot from "./Bot.class";
import type { Command, CommandHandlerCtx } from "./CommandUtils.class";
import Logger from "./Logger.class";
import type Room from "./Room.class";

type QueuedRequest = {
    fn: () => Promise<void>;
    resolve: () => void;
    reject: (err: unknown) => void;
};

export default class Utilitary {
    private static requestQueue: QueuedRequest[] = [];
    private static queueRunning = false;
    private static readonly QUEUE_DELAY_MS = 2800;

    public static formatTime(time: number) {
        const milliseconds = time;
        let seconds = Math.floor(milliseconds / 1000);
        let minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        const hours = Math.floor(minutes / 60);
        minutes = minutes % 60;
        const minutesDisplay = minutes.toString().padStart(2, "0");
        const secondsDisplay = seconds.toString().padStart(2, "0");
        const hoursDisplay = hours.toString().padStart(2, "0");
        return `${hoursDisplay}:${minutesDisplay}:${secondsDisplay}`;
    }

    public static getUniqueStrings<T extends string>(items: T[]): T[] {
        return [...new Set(items)];
    }

    public static readFileInDataFolder(fileName: string): string | null {
        if (!fs.existsSync(dataPath)) {
            return null;
        }
        const filePath = path.join(dataPath, fileName);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, "utf-8");
        if (content.length === 0) {
            return null;
        }
        return content;
    }

    public static writeFileInDataFolder(fileName: string, content: string) {
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath);
        }
        fs.writeFileSync(path.join(dataPath, fileName), content);
    }

    public static createUserToken(): string {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let token = "";
        for (let i = 0; i < 16; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
        return token;
    }

    public static sendChatMessage(room: Room, message: string) {
        const chatSocket = room.chatSocket;
        if (!chatSocket?.connected) return;
        const chunks = Utilitary.cutMessage(message, 298);
        for (const chunk of chunks) {
            chatSocket.emit("chat", chunk, {});
        }
    }

    public static displayAlphaScore(score: number) {
        const alphas = Math.floor(score / 26);
        const remaining = score % 26;
        const remainingLetter = String.fromCharCode(65 + remaining);
        return `${alphas} (${remainingLetter})`;
    }

    public static randomUUID() {
        return randomUUID();
    }

    public static valueToUUID(value: string) {
        return uuidv5(value, NAMESPACE_UUID);
    }

    public static async postJson<T>(apiPath: string, obj: Record<string, any>): Promise<T> {
        const res = await fetch(`https://${jklmDomain}${apiPath}`, {
            method: "POST",
            body: JSON.stringify(obj),
            headers: {
                "Content-Type": "application/json",
            },
        });
        const text = await res.text();
        try {
            return JSON.parse(text) as T;
        } catch {
            throw new Error(`jklm API ${apiPath} failed: ${text}`);
        }
    }

    public static queuedPostJson<T>(apiPath: string, obj: Record<string, any>): Promise<T> {
        return new Promise((resolve, reject) => {
            Utilitary.requestQueue.push({
                fn: async () => {
                    const result = await Utilitary.postJson<T>(apiPath, obj);
                    resolve(result);
                },
                resolve: () => {},
                reject,
            });
            Utilitary.pumpQueue();
        });
    }

    private static async pumpQueue() {
        if (Utilitary.queueRunning) return;
        Utilitary.queueRunning = true;
        while (Utilitary.requestQueue.length > 0) {
            const item = Utilitary.requestQueue.shift()!;
            try {
                await item.fn();
            } catch (err) {
                item.reject(err);
            }
            await new Promise((r) => setTimeout(r, Utilitary.QUEUE_DELAY_MS));
        }
        Utilitary.queueRunning = false;
    }

    public static async resolveRoomServerUrl(room: Room) {
        if (room.constantRoomData.serverUrl) return;
        const response = await Utilitary.queuedPostJson<{ url: string }>("/api/joinRoom", {
            roomCode: room.constantRoomData.roomCode,
        });
        if (!response.url) {
            throw new Error(`Could not resolve server URL for room ${room.constantRoomData.roomCode}`);
        }
        room.constantRoomData.serverUrl = response.url;
    }

    public static getCurrentPlayer(gameData: GameData): (MilestoneRound["playerStatesByPeerId"][string] & { peerId: number }) | null {
        if (gameData.milestone.name !== "round") {
            return null;
        }
        const peerId = gameData.milestone.currentPlayerPeerId;
        const state = gameData.milestone.playerStatesByPeerId[String(peerId)];
        if (!state) return null;
        return { ...state, peerId };
    }

    public static executeEventHandlers(eventHandler: BotEventHandler, ctx: EventCtx) {
        const previousHandlersCtx: BotEventPreviousHandlersCtx = {};
        if (Array.isArray(eventHandler)) {
            for (const handler of eventHandler) {
                handler(ctx, previousHandlersCtx);
            }
        } else {
            eventHandler(ctx, previousHandlersCtx);
        }
    }

    public static destroyRoom(bot: Bot, room: Room) {
        const cleanupSocket = (socket: Socket | null) => {
            if (!socket) return;
            socket.removeAllListeners();
            socket.disconnect();
        };
        cleanupSocket(room.chatSocket);
        cleanupSocket(room.gameSocket);
        room.chatSocket = null;
        room.gameSocket = null;
        delete bot.rooms[room.id];
    }

    private static buildEventCtx(bot: Bot, room: Room, event: string, args: any[]): EventCtx {
        return {
            bot: {
                getResource: bot.resourceManager.get.bind(bot.resourceManager),
                session: bot.botData!.session,
                rooms: bot.rooms,
                rawBot: bot,
            },
            message: { event, args },
            utils: {
                sendChatMessage: (m: string) => Utilitary.sendChatMessage(room, m),
                userIsAdmin: (authId: string | null | undefined) => {
                    if (!authId) return false;
                    return bot.botData!.adminAuthIds.includes(authId);
                },
                setWord: (word: string) => {
                    room.gameSocket?.emit("setWord", word, true);
                },
                joinRound: () => {
                    room.gameSocket?.emit("joinRound");
                },
                startRoundNow: () => {
                    room.gameSocket?.emit("startRoundNow");
                },
                setRules: (rules: Record<string, unknown>) => {
                    room.gameSocket?.emit("setRulesLocked", false);
                    room.gameSocket?.emit("setRules", rules);
                    room.gameSocket?.emit("setRulesLocked", true);
                },
                setRulesLocked: (locked: boolean) => {
                    room.gameSocket?.emit("setRulesLocked", locked);
                },
                setRoomPublic: (isPublic: boolean) => {
                    room.chatSocket?.emit("setRoomPublic", isPublic);
                },
                setUserModerator: (peerId: number, isModerator: boolean) => {
                    room.chatSocket?.emit("setUserModerator", peerId, isModerator, () => {});
                },
            },
            room: {
                roomState: room.roomState,
                constantRoomData: room.constantRoomData,
                rawRoom: room,
                isHealthy: () => {
                    const botRoom = bot.rooms[room.id];
                    return botRoom !== undefined && botRoom.isConnected();
                },
            },
        };
    }

    public static initializeRoomSockets(bot: Bot, room: Room) {
        const url = room.constantRoomData.serverUrl;
        if (!url) {
            throw new Error("Room server URL is not set");
        }

        const session = bot.botData!.session;
        const joinData = {
            auth: session.getJoinAuth(),
            language: session.language,
            nickname: session.nickname,
            picture: session.picture,
            roomCode: room.constantRoomData.roomCode,
            userToken: room.constantRoomData.userToken,
            takeOver: false,
            isUsernameHidden: false,
        };

        const chatSocket = io(url, {
            transports: ["websocket"],
            reconnection: false,
            timeout: 8000,
        });
        room.chatSocket = chatSocket;

        chatSocket.on("connect", () => {
            chatSocket.emit("joinRoom", joinData, (ack: { selfPeerId: number; roomEntry?: { isPublic?: boolean } }) => {
                room.roomState.myPeerId = ack.selfPeerId;
                room.roomState.roomData = {
                    code: room.constantRoomData.roomCode,
                    isPublic: ack.roomEntry?.isPublic ?? room.constantRoomData.targetConfig.isPublic,
                    chatters: [],
                };
                room.roomState.lastActivityAt = Date.now();

                if (bot.handlers.chatConnect) {
                    Utilitary.executeEventHandlers(bot.handlers.chatConnect, Utilitary.buildEventCtx(bot, room, "chatConnect", []));
                }

                chatSocket.emit("getChatterProfiles", (profiles: any[]) => {
                    if (Array.isArray(profiles) && room.roomState.roomData) {
                        room.roomState.roomData.chatters = profiles.map((p) => Utilitary.profileToChatter(p));
                    }
                });

                const gameSocket = io(url, {
                    transports: ["websocket"],
                    reconnection: false,
                    timeout: 8000,
                });
                room.gameSocket = gameSocket;

                gameSocket.on("connect", () => {
                    Utilitary.bindSocketHandlers(bot, room, "chat", chatSocket);
                    Utilitary.bindSocketHandlers(bot, room, "game", gameSocket);

                    if (bot.handlers.gameConnect) {
                        Utilitary.executeEventHandlers(
                            bot.handlers.gameConnect,
                            Utilitary.buildEventCtx(bot, room, "gameConnect", [])
                        );
                    }

                    gameSocket.emit(
                        "joinGame",
                        "bombparty",
                        room.constantRoomData.roomCode,
                        room.constantRoomData.userToken,
                        true
                    );
                });

                gameSocket.on("disconnect", () => {
                    if (bot.handlers.gameDisconnect) {
                        Utilitary.executeEventHandlers(
                            bot.handlers.gameDisconnect,
                            Utilitary.buildEventCtx(bot, room, "gameDisconnect", [])
                        );
                    }
                });

                gameSocket.on("connect_error", (err) => {
                    Logger.error({
                        message: `Game socket connect error for ${room.constantRoomData.roomCode}: ${err.message}`,
                        path: "Utilitary.class.ts",
                    });
                });
            });
        });

        chatSocket.on("disconnect", () => {
            if (bot.handlers.chatDisconnect) {
                Utilitary.executeEventHandlers(
                    bot.handlers.chatDisconnect,
                    Utilitary.buildEventCtx(bot, room, "chatDisconnect", [])
                );
            }
        });

        chatSocket.on("connect_error", (err) => {
            Logger.error({
                message: `Chat socket connect error for ${room.constantRoomData.roomCode}: ${err.message}`,
                path: "Utilitary.class.ts",
            });
        });
    }

    private static bindSocketHandlers(bot: Bot, room: Room, side: "chat" | "game", socket: Socket) {
        const handlers = bot.handlers[side];
        for (const eventName of Object.keys(handlers)) {
            if (eventName === "disconnect") continue;
            const handler = handlers[eventName as keyof typeof handlers];
            if (!handler) continue;
            socket.on(eventName, (...args: any[]) => {
                room.roomState.lastActivityAt = Date.now();
                if (!bot.rooms[room.id]) return;
                Utilitary.executeEventHandlers(handler, Utilitary.buildEventCtx(bot, room, eventName, args));
            });
        }
    }

    public static profileToChatter(profile: any): Chatter {
        return {
            peerId: profile.peerId,
            nickname: profile.nickname ?? "?",
            authId: profile.auth?.id ?? null,
            isOnline: profile.isOnline !== false,
            isModerator: Array.isArray(profile.roles) && profile.roles.includes("moderator"),
        };
    }

    public static cutMessage(message: string, maxLength: number) {
        let splitText = message.split(" ");
        let buffer = "";
        let messages: string[] = [];
        for (let letterGroup of splitText) {
            if (buffer.length + letterGroup.length < maxLength) {
                buffer += (buffer ? " " : "") + letterGroup;
            } else {
                messages.push(buffer);
                buffer = letterGroup;
            }
        }
        if (buffer.length) {
            messages.push(buffer);
        }
        return messages;
    }

    public static readArrayFromFile(filePath: string) {
        const fileText = readFileSync(filePath, "utf-8");
        const words = fileText.split(/\r?\n/);
        return words.map((word) => word.trim()).filter((word) => word.length > 0);
    }

    public static async readArrayFromFileAsync(filePath: string) {
        const fileStream = createReadStream(filePath);
        const array: string[] = [];

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        for await (const line of rl) {
            array.push(line);
        }
        return array;
    }

    public static insertionSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
        const n = arr.length;
        for (let i = 1; i < n; i++) {
            const currentElement = arr[i];
            let j = i - 1;
            while (j >= 0 && compare(arr[j], currentElement) > 0) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = currentElement;
        }
        return arr;
    }

    public static handleCommandIfExists(
        ctx: EventCtx,
        rawMessage: string,
        chatter: Chatter,
        commands: Command[]
    ):
        | "no-command-given"
        | "command-not-found"
        | "trying-to-handle-command"
        | "no-command-attempted"
        | "not-room-creator"
        | "not-admin" {
        const normalizedMessage = rawMessage.trim().replace(/[ ]+/, " ");
        const commandPrefixes = ["!", "/", "."];
        if (commandPrefixes.some((prefix) => normalizedMessage.startsWith(prefix))) {
            const args = normalizedMessage.slice(1).split(" ");
            const requestedCommand = args[0];
            if (!requestedCommand) return "no-command-given";
            const params = args
                .slice(1)
                .filter((arg) => arg.startsWith("-"))
                .map((arg) => arg.slice(1).toLowerCase());
            const commandArgs = args
                .slice(1)
                .filter((arg) => !arg.startsWith("-"))
                .map((arg) => arg.toLowerCase());
            const command = commands.find((c) => c.aliases.includes(requestedCommand));
            if (!command) return "command-not-found";
            if (command.adminRequired && !ctx.utils.userIsAdmin(chatter.authId)) {
                return "not-admin";
            }
            if (
                !(
                    (command.roomCreatorRequired &&
                        ctx.room.constantRoomData.roomCreatorAuthId === chatter.authId &&
                        chatter.authId !== null) ||
                    ctx.utils.userIsAdmin(chatter.authId) ||
                    !command.roomCreatorRequired
                )
            ) {
                return "not-room-creator";
            }

            Logger.log({
                message: `Attempting to handle command ${command.id} from message ${rawMessage}`,
                path: "Utilitary.class.ts",
            });
            const commandHandlerCtx: CommandHandlerCtx = {
                bot: ctx.bot,
                room: ctx.room,
                utils: ctx.utils,
                rawMessage,
                params,
                args: commandArgs,
                gamer: chatter,
                normalizedMessage,
                usedAlias: requestedCommand,
                normalizedTextAfterCommand: normalizedMessage.slice(requestedCommand.length + 1).trim(),
            };
            command.handler(commandHandlerCtx);
            return "trying-to-handle-command";
        }
        return "no-command-attempted";
    }
}
