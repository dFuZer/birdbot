import { randomUUID } from "crypto";
import fs from "fs";
import type WebSocket from "ws";
import type NetworkAdapter from "../abstract/NetworkAdapter.abstract.class";
import type { GameData, Player } from "../types/gameTypes";
import type { BotEventHandler, BotEventPreviousHandlersCtx, EventCtx } from "../types/libEventTypes";
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

    public static readFileInDataFolder(fileName: string): string | null {
        const dataFolder = "./.data";
        if (!fs.existsSync(dataFolder)) {
            return null;
        }
        const content = fs.readFileSync(`${dataFolder}/${fileName}`, "utf-8");
        if (content.length === 0) {
            return null;
        }
        return content;
    }

    public static writeFileInDataFolder(fileName: string, content: string) {
        const dataFolder = "./.data";
        if (!fs.existsSync(dataFolder)) {
            fs.mkdirSync(dataFolder);
        }
        fs.writeFileSync(`${dataFolder}/${fileName}`, content);
    }

    public static sendChatMessage(ws: WebSocket, message: string, adapter: NetworkAdapter) {
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

    public static async getJson<T>(path: string): Promise<T> {
        const res = await fetch(`https://croco.games${path}`, {
            method: "GET",
        });
        const data = await res.json();
        return data as T;
    }

    public static async postJson<T>(path: string, obj: Record<string, any>): Promise<T> {
        const res = await fetch(`https://croco.games${path}`, {
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
            return null;
        }
        const { round } = gameData;
        const index = (round.startPlayerIndex + round.turnIndex) % gameData.players.length;
        return gameData.players[index]!;
    }

    public static async executeEventHandlers(eventHandler: BotEventHandler, ctx: EventCtx) {
        const previousHandlersCtx: BotEventPreviousHandlersCtx = {};
        if (Array.isArray(eventHandler)) {
            for (const handler of eventHandler) {
                await handler(ctx, previousHandlersCtx);
            }
        } else {
            await eventHandler(ctx, previousHandlersCtx);
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

    public static tryExecuteEventHandlers(eventName: string, fn: () => void) {
        try {
            fn();
        } catch (error) {
            Logger.error({
                message: `Error executing event handler ${eventName}:`,
                path: "Utilitary.class.ts",
                errorType: "unknown",
                error,
            });
        }
    }

    public static initializeRoomSocket(bot: Bot, room: Room) {
        const getEventCtx = (buffer: Buffer): EventCtx => {
            const ctx: EventCtx = {
                bot: {
                    getResource: bot.resourceManager.get.bind(bot.resourceManager),
                    session: bot.botData!.session,
                    networkAdapter: bot.networkAdapter,
                },
                message: buffer,
                utils: {
                    sendChatMessage: (m: string) => {
                        Utilitary.sendChatMessage(room.ws!, m, bot.networkAdapter);
                    },
                },
                room: {
                    roomState: room.roomState,
                    constantRoomData: room.constantRoomData,
                    ws: room.ws!,
                },
            };
            return ctx;
        };

        room.ws!.on("open", () => {
            if (!bot.handlers.open) {
                console.error("No open handler");
                return;
            }

            Utilitary.tryExecuteEventHandlers("open", () => {
                Logger.log({
                    message: "Executing open handler",
                    path: "Utilitary.class.ts",
                });
                Utilitary.executeEventHandlers(bot.handlers.open!, getEventCtx(new Buffer("")));
            });
        });
        room.ws!.on("close", () => {
            if (!bot.handlers.close) {
                console.error("No close handler");
                return;
            }
            Utilitary.tryExecuteEventHandlers("close", () => {
                Logger.log({
                    message: "Executing close handler",
                    path: "Utilitary.class.ts",
                });
                Utilitary.executeEventHandlers(bot.handlers.close!, getEventCtx(new Buffer("")));
            });
        });
        room.ws!.on("message", (message: Buffer) => {
            const baseMessageData = bot.networkAdapter.readNodeMessageBaseData(message);

            if (baseMessageData.eventType === "session") {
                const sessionEventType = baseMessageData.sessionEventType;
                const handler = bot.handlers.message.session[sessionEventType];
                if (!handler) {
                    console.error(`No handler for event type ${sessionEventType}`);
                    return;
                }
                Utilitary.tryExecuteEventHandlers(`session-${sessionEventType}`, () => {
                    Logger.log({
                        message: `Executing session event handler ${sessionEventType}`,
                        path: "Utilitary.class.ts",
                    });
                    Utilitary.executeEventHandlers(handler, getEventCtx(message));
                });
            } else {
                const handler = bot.handlers.message[baseMessageData.eventType];
                if (!handler) {
                    console.error(`No handler for event type ${baseMessageData.eventType}`);
                    return;
                }
                Utilitary.tryExecuteEventHandlers(`node-${baseMessageData.eventType}`, () => {
                    Logger.log({
                        message: `Executing node event handler ${baseMessageData.eventType}`,
                        path: "Utilitary.class.ts",
                    });
                    Utilitary.executeEventHandlers(handler, getEventCtx(message));
                });
            }
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

    public static handleCommandIfExists(
        ctx: EventCtx,
        rawMessage: string,
        commands: Command[]
    ): "no-command-given" | "command-not-found" | "command-handled" | "no-command-attempted" | "invalid-arguments" {
        const normalizedMessage = rawMessage.trim().replace(/[ ]+/, " ");
        const commandPrefixes = ["!", "/", "."];
        if (commandPrefixes.some((prefix) => normalizedMessage.startsWith(prefix))) {
            const args = normalizedMessage.slice(1).split(" ");
            const requestedCommand = args[0];
            if (!requestedCommand) return "no-command-given";
            const params = args
                .slice(1)
                .filter((arg) => arg.startsWith("-"))
                .map((arg) => arg.slice(1));
            const commandArgs = args.slice(1).filter((arg) => !arg.startsWith("-"));
            const command = commands.find((c) => c.aliases.includes(requestedCommand));
            if (!command) return "command-not-found";
            Logger.log({
                message: `Attempting to handle command ${command.id} from message ${rawMessage}`,
                path: "Utilitary.class.ts",
            });
            const commandHandlerCtx: CommandHandlerCtx = {
                bot: ctx.bot,
                room: ctx.room,
                rawMessage,
                params,
                args: commandArgs,
                normalizedMessage,
                usedAlias: requestedCommand,
                utils: ctx.utils,
            };
            const commandStatus = command.handler(commandHandlerCtx);
            if (commandStatus === "handled") return "command-handled";
            if (commandStatus === "invalid-arguments") return "invalid-arguments";
        }
        return "no-command-attempted";
    }
}
