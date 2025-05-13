import { randomUUID } from "crypto";
import fs, { createReadStream, readFileSync } from "fs";
import path from "path";
import readline from "readline";
import { v5 as uuidv5 } from "uuid";
import WebSocket from "ws";
import type AbstractNetworkAdapter from "../abstract/AbstractNetworkAdapter.class";
import { crocoDomain } from "../constants/gameConstants";
import { NAMESPACE_UUID } from "../env";
import { dataPath } from "../paths";
import type { GameData, Gamer, Player } from "../types/gameTypes";
import type {
    BotEventHandler,
    BotEventPreviousHandlersCtx,
    EventCtx,
} from "../types/libEventTypes";
import type Bot from "./Bot.class";
import type { Command, CommandHandlerCtx } from "./CommandUtils.class";
import Logger from "./Logger.class";
import type Room from "./Room.class";
export default class Utilitary {
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

    public static sendChatMessage(
        ws: WebSocket,
        message: string,
        adapter: AbstractNetworkAdapter
    ) {
        let cutTxt = message.split(" ");
        let buffer = "";
        let chunks = [];
        let charLengthLimit = 298;
        for (let textChunk of cutTxt) {
            if (buffer.length + textChunk.length < charLengthLimit) {
                buffer += " " + textChunk;
            } else {
                chunks.push(buffer);
                buffer = textChunk;
            }
        }
        if (buffer.length) {
            chunks.push(buffer);
        }
        for (let chunk of chunks) {
            const message = adapter.getSendChatMessage(chunk);
            ws.send(message);
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

    public static async getJson<T>(path: string): Promise<T> {
        const res = await fetch(`https://${crocoDomain}${path}`, {
            method: "GET",
        });
        const data = await res.json();
        return data as T;
    }

    public static async postJson<T>(
        path: string,
        obj: Record<string, any>
    ): Promise<T> {
        const res = await fetch(`https://${crocoDomain}${path}`, {
            method: "POST",
            body: JSON.stringify(obj),
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = await res.json();
        return data as T;
    }

    public static getCurrentPlayer(gameData: GameData) {
        if (gameData.step.value !== "round") {
            Logger.error({
                message: `Trying to get current player while step is ${gameData.step.value} instead of round.`,
                path: "Utilitary.class.ts",
            });
            return null;
        }
        const { round } = gameData;
        const index =
            (round.startPlayerIndex + round.turnIndex) %
            gameData.players.length;
        return gameData.players[index]!;
    }

    public static executeEventHandlers(
        eventHandler: BotEventHandler,
        ctx: EventCtx
    ) {
        const previousHandlersCtx: BotEventPreviousHandlersCtx = {};
        if (Array.isArray(eventHandler)) {
            for (const handler of eventHandler) {
                handler(ctx, previousHandlersCtx);
            }
        } else {
            eventHandler(ctx, previousHandlersCtx);
        }
    }

    public static resetPlayer(player: Player) {
        player.justExploded = false;
        player.lives = 0;
        player.points = 0;
        player.usedLetters = "";
        player.lastPrompt = "";
        player.lastSubmit = null;
        player.text = "";
    }

    public static destroyRoom(bot: Bot, room: Room) {
        const ws = room.ws;
        if (ws) {
            ws.listeners("close").forEach((listener) => {
                ws.off("close", listener as any);
            });
            ws.listeners("open").forEach((listener) => {
                ws.off("open", listener as any);
            });
            ws.listeners("message").forEach((listener) => {
                ws.off("message", listener as any);
            });
            ws.terminate();
        }
        delete bot.rooms[room.id];
    }

    public static initializeRoomSocket(bot: Bot, room: Room) {
        const ws = new WebSocket(`wss://${room.nodeHost}/api/websocket`, {
            perMessageDeflate: false,
        });
        room.ws = ws;

        const getEventCtx = (buffer: Buffer): EventCtx => {
            const ctx: EventCtx = {
                bot: {
                    getResource: bot.resourceManager.get.bind(
                        bot.resourceManager
                    ),
                    session: bot.botData!.session,
                    networkAdapter: bot.networkAdapter,
                    rooms: bot.rooms,
                    rawBot: bot,
                },
                message: buffer,
                utils: {
                    sendChatMessage: (m: string) => {
                        Utilitary.sendChatMessage(
                            room.ws!,
                            m,
                            bot.networkAdapter
                        );
                    },
                    userIsAdmin: (username: string) => {
                        return bot.botData!.adminAccountUsernames.includes(
                            username
                        );
                    },
                },
                room: {
                    roomState: room.roomState,
                    constantRoomData: room.constantRoomData,
                    ws: room.ws!,
                    rawRoom: room,
                    isHealthy: () => {
                        const botRoom = bot.rooms[room.id];

                        return (
                            botRoom !== undefined &&
                            botRoom.ws !== null &&
                            botRoom.ws.readyState === WebSocket.OPEN
                        );
                    },
                },
            };
            return ctx;
        };

        ws.on("open", () => {
            if (!bot.handlers.open) {
                Logger.error({
                    message: "No open handler",
                    path: "Utilitary.class.ts",
                });
                return;
            }

            Utilitary.executeEventHandlers(
                bot.handlers.open,
                getEventCtx(new Buffer(""))
            );
        });

        ws.on("close", () => {
            if (!bot.handlers.close) {
                Logger.error({
                    message: "No close handler",
                    path: "Utilitary.class.ts",
                });
                return;
            }
            Utilitary.executeEventHandlers(
                bot.handlers.close,
                getEventCtx(new Buffer(""))
            );
        });

        ws.on("message", (message: Buffer) => {
            const baseMessageData =
                bot.networkAdapter.readNodeMessageBaseData(message);
            let handler: BotEventHandler | undefined;
            let eventName: string;

            if (baseMessageData.eventType === "session") {
                const sessionEventType = baseMessageData.sessionEventType;
                handler = bot.handlers.message.session[sessionEventType];
                eventName = `session-${sessionEventType}`;
            } else {
                handler = bot.handlers.message[baseMessageData.eventType];
                eventName = `node-${baseMessageData.eventType}`;
            }

            if (!handler) {
                Logger.error({
                    message: `No handler for event type ${eventName}`,
                    path: "Utilitary.class.ts",
                });
                return;
            }

            Utilitary.executeEventHandlers(handler, getEventCtx(message));
        });
    }

    public static cutMessage(message: string, maxLength: number) {
        let splitText = message.split(" ");
        let buffer = "";
        let messages: string[] = [];
        for (let letterGroup of splitText) {
            if (buffer.length + letterGroup.length < maxLength) {
                buffer += " " + letterGroup;
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
        return words
            .map((word) => word.trim())
            .filter((word) => word.length > 0);
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

    public static insertionSort<T>(
        arr: T[],
        compare: (a: T, b: T) => number
    ): T[] {
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
        gamer: Gamer,
        commands: Command[]
    ):
        | "no-command-given"
        | "command-not-found"
        | "trying-to-handle-command"
        | "no-command-attempted"
        | "not-room-creator" {
        const normalizedMessage = rawMessage.trim().replace(/[ ]+/, " ");
        const commandPrefixes = ["!", "/", "."];
        if (
            commandPrefixes.some((prefix) =>
                normalizedMessage.startsWith(prefix)
            )
        ) {
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
            const command = commands.find((c) =>
                c.aliases.includes(requestedCommand)
            );
            if (!command) return "command-not-found";
            if (
                !(
                    (command.roomCreatorRequired &&
                        ctx.room.constantRoomData.roomCreatorUsername ===
                            gamer.identity.name) ||
                    ctx.utils.userIsAdmin(gamer.identity.name) ||
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
                gamer,
                normalizedMessage,
                usedAlias: requestedCommand,
                normalizedTextAfterCommand: normalizedMessage
                    .slice(requestedCommand.length + 1)
                    .trim(),
            };
            command.handler(commandHandlerCtx);
            return "trying-to-handle-command";
        }
        return "no-command-attempted";
    }
}
