import { randomUUID } from "crypto";
import fs, { createReadStream, readFileSync } from "fs";
import path from "path";
import readline from "readline";
import { io, type Socket } from "socket.io-client";
import { v5 as uuidv5 } from "uuid";
import { NAMESPACE_UUID } from "../env";
import { discoverRoomServer } from "../jklm/http";
import { dataPath } from "../paths";
import type { Chatter, GameData, MilestoneRound } from "../types/gameTypes";
import type {
    BotEventHandler,
    BotEventPreviousHandlersCtx,
    ChatStyle,
    ChatStyleMap,
    ChatStyleName,
    EventCtx,
} from "../types/libEventTypes";
import type Bot from "./Bot.class";
import CommandUtils, {
    type Command,
    type CommandDispatchResult,
    type CommandSource,
} from "./CommandUtils.class";
import Logger from "./Logger.class";
import type Room from "./Room.class";

export default class Utilitary {
    private static readonly SOCKET_TIMEOUT_MS = 8000;
    public static readonly CHAT_STYLES: ChatStyleMap = Object.freeze({
        error: Object.freeze({ color: "#f0b7b7" }),
        success: Object.freeze({ color: "#b7f0bb" }),
        neutral: Object.freeze({ color: "#c7cbf0" }),
        info: Object.freeze({ color: "#c7cbf0", "font-weight": "bold" }),
        important: Object.freeze({ color: "#E2E600", "font-weight": "bold" }),
    });

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
        // Same charset as BBv7 / jklm client tokens
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";
        let token = "";
        for (let i = 0; i < 16; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
        return token;
    }

    public static sendChatMessage(room: Room, message: string, style?: ChatStyleName | ChatStyle) {
        const chatSocket = room.chatSocket;
        if (!chatSocket?.connected) return;
        const resolvedStyle = typeof style === "string" ? Utilitary.CHAT_STYLES[style] : style;
        const chunks = Utilitary.cutMessage(message, 298);
        for (const chunk of chunks) {
            chatSocket.emit("chat", chunk, resolvedStyle ?? {});
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

    public static async resolveRoomServerUrl(room: Room, forceRediscovery = false) {
        if (room.constantRoomData.serverUrl && !forceRediscovery) return;
        const response = await discoverRoomServer(room.constantRoomData.roomCode);
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

    public static teardownRoomSockets(room: Room) {
        room.connectionGeneration++;
        const cleanupSocket = (socket: Socket | null) => {
            if (!socket) return;
            socket.removeAllListeners();
            socket.disconnect();
        };
        cleanupSocket(room.chatSocket);
        cleanupSocket(room.gameSocket);
        room.chatSocket = null;
        room.gameSocket = null;
    }

    public static forgetRoom(bot: Bot, room: Room) {
        Utilitary.teardownRoomSockets(room);
        delete bot.rooms[room.id];
    }

    public static destroyRoom(bot: Bot, room: Room) {
        Utilitary.forgetRoom(bot, room);
        void bot.onRoomDestroyed?.(room);
    }

    public static disconnectRoomsForRestart(bot: Bot) {
        for (const room of Object.values(bot.rooms)) {
            Utilitary.teardownRoomSockets(room);
        }
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
                sendChatMessage: (message, style) => Utilitary.sendChatMessage(room, message, style),
                chatStyles: Utilitary.CHAT_STYLES,
                userIsAdmin: (authId: string | null | undefined) => {
                    if (!authId || !bot.botData) return false;
                    return bot.botData.staff.admins.has(authId);
                },
                userIsAutomod: (authId: string | null | undefined) => {
                    if (!authId || !bot.botData) return false;
                    return bot.botData.staff.automods.has(authId);
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
                setUserBanned: (peerId: number, isBanned: boolean) => {
                    room.chatSocket?.emit("setUserBanned", peerId, isBanned, () => {});
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

    public static initializeRoomSockets(bot: Bot, room: Room): Promise<void> {
        const url = room.constantRoomData.serverUrl;
        if (!url) {
            return Promise.reject(new Error("Room server URL is not set"));
        }
        if (!bot.botData) {
            return Promise.reject(new Error("Bot must be initialized before joining a room"));
        }

        Utilitary.teardownRoomSockets(room);
        const generation = room.connectionGeneration;
        const session = bot.botData.session;

        const joinData = {
            auth: session.getJoinAuth(),
            language: session.language,
            nickname:
                typeof room.constantRoomData.targetConfig.botName === "string"
                    ? room.constantRoomData.targetConfig.botName
                    : session.nickname,
            picture:
                typeof room.constantRoomData.targetConfig.pictureUrl === "string"
                    ? room.constantRoomData.targetConfig.pictureUrl
                    : session.picture,
            roomCode: room.constantRoomData.roomCode,
            userToken: room.constantRoomData.userToken,
            takeOver: false,
            isUsernameHidden: false,
        };

        return new Promise((resolve, reject) => {
            let ready = false;
            let settled = false;
            let chatAckTimer: NodeJS.Timeout | undefined;
            let gameSetupTimer: NodeJS.Timeout | undefined;

            const isCurrent = () => bot.rooms[room.id] === room && room.connectionGeneration === generation;
            const fail = (error: Error) => {
                if (settled) return;
                settled = true;
                if (chatAckTimer) clearTimeout(chatAckTimer);
                if (gameSetupTimer) clearTimeout(gameSetupTimer);
                if (isCurrent()) Utilitary.teardownRoomSockets(room);
                reject(error);
            };

            const chatSocket = io(url, {
                transports: ["websocket"],
                reconnection: false,
                timeout: Utilitary.SOCKET_TIMEOUT_MS,
            });
            room.chatSocket = chatSocket;

            chatSocket.once("connect", () => {
                if (!isCurrent()) return;
                chatAckTimer = setTimeout(() => {
                    fail(new Error(`Timed out waiting for joinRoom acknowledgement for ${room.constantRoomData.roomCode}`));
                }, Utilitary.SOCKET_TIMEOUT_MS);

                chatSocket.emit("joinRoom", joinData, (ack: unknown) => {
                    if (settled || !isCurrent()) return;
                    if (
                        !ack ||
                        typeof ack !== "object" ||
                        typeof (ack as { selfPeerId?: unknown }).selfPeerId !== "number"
                    ) {
                        fail(new Error(`Invalid joinRoom acknowledgement for ${room.constantRoomData.roomCode}`));
                        return;
                    }
                    if (chatAckTimer) clearTimeout(chatAckTimer);

                    const validAck = ack as { selfPeerId: number; roomEntry?: { isPublic?: unknown } };
                    room.roomState.myPeerId = validAck.selfPeerId;
                    room.roomState.roomData = {
                        code: room.constantRoomData.roomCode,
                        isPublic:
                            typeof validAck.roomEntry?.isPublic === "boolean"
                                ? validAck.roomEntry.isPublic
                                : room.constantRoomData.targetConfig.isPublic,
                        chatters: [],
                    };
                    room.roomState.lastActivityAt = Date.now();

                    Utilitary.bindSocketHandlers(bot, room, "chat", chatSocket);
                    if (bot.handlers.chatConnect) {
                        Utilitary.executeEventHandlers(
                            bot.handlers.chatConnect,
                            Utilitary.buildEventCtx(bot, room, "chatConnect", [])
                        );
                    }

                    chatSocket.emit("getChatterProfiles", (profiles: unknown) => {
                        if (Array.isArray(profiles) && room.roomState.roomData && isCurrent()) {
                            room.roomState.roomData.chatters = profiles.map((profile) =>
                                Utilitary.profileToChatter(profile)
                            );
                        }
                    });

                    const gameSocket = io(url, {
                        transports: ["websocket"],
                        reconnection: false,
                        timeout: Utilitary.SOCKET_TIMEOUT_MS,
                    });
                    room.gameSocket = gameSocket;

                    gameSocket.once("connect", () => {
                        if (!isCurrent()) return;
                        Utilitary.bindSocketHandlers(bot, room, "game", gameSocket);

                        gameSocket.once("setup", () => {
                            if (settled) return;
                            if (!isCurrent() || !room.isConnected() || !room.roomState.gameData) {
                                fail(new Error(`Game setup failed for room ${room.constantRoomData.roomCode}`));
                                return;
                            }
                            if (gameSetupTimer) clearTimeout(gameSetupTimer);
                            ready = true;
                            settled = true;
                            resolve();
                        });

                        if (bot.handlers.gameConnect) {
                            Utilitary.executeEventHandlers(
                                bot.handlers.gameConnect,
                                Utilitary.buildEventCtx(bot, room, "gameConnect", [])
                            );
                        }

                        gameSetupTimer = setTimeout(() => {
                            fail(new Error(`Timed out waiting for game setup for ${room.constantRoomData.roomCode}`));
                        }, Utilitary.SOCKET_TIMEOUT_MS);

                        gameSocket.emit(
                            "joinGame",
                            "bombparty",
                            room.constantRoomData.roomCode,
                            room.constantRoomData.userToken,
                            true
                        );
                    });

                    gameSocket.on("disconnect", () => {
                        if (!isCurrent()) return;
                        if (!ready) {
                            fail(new Error(`Game socket disconnected before setup for ${room.constantRoomData.roomCode}`));
                            return;
                        }
                        if (bot.handlers.gameDisconnect) {
                            Utilitary.executeEventHandlers(
                                bot.handlers.gameDisconnect,
                                Utilitary.buildEventCtx(bot, room, "gameDisconnect", [])
                            );
                        }
                    });

                    gameSocket.once("connect_error", (error: Error) => {
                        if (!ready) {
                            fail(
                                new Error(
                                    `Game socket connection failed for ${room.constantRoomData.roomCode}: ${error.message}`
                                )
                            );
                        } else {
                            Logger.error({
                                message: `Game socket connect error for ${room.constantRoomData.roomCode}: ${error.message}`,
                                path: "Utilitary.class.ts",
                            });
                        }
                    });
                });
            });

            chatSocket.on("disconnect", () => {
                if (!isCurrent()) return;
                if (!ready) {
                    fail(new Error(`Chat socket disconnected before setup for ${room.constantRoomData.roomCode}`));
                    return;
                }
                if (bot.handlers.chatDisconnect) {
                    Utilitary.executeEventHandlers(
                        bot.handlers.chatDisconnect,
                        Utilitary.buildEventCtx(bot, room, "chatDisconnect", [])
                    );
                }
            });

            chatSocket.once("connect_error", (error: Error) => {
                if (!ready) {
                    fail(
                        new Error(
                            `Chat socket connection failed for ${room.constantRoomData.roomCode}: ${error.message}`
                        )
                    );
                } else {
                    Logger.error({
                        message: `Chat socket connect error for ${room.constantRoomData.roomCode}: ${error.message}`,
                        path: "Utilitary.class.ts",
                    });
                }
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
        commands: readonly Command[],
        options?: { isScoreEligible?: boolean; source?: CommandSource },
    ): CommandDispatchResult {
        return CommandUtils.dispatch({
            ctx,
            rawMessage,
            chatter,
            registry: CommandUtils.getRegistry(commands),
            source: options?.source,
            isScoreEligible: options?.isScoreEligible,
        });
    }
}
