import { randomUUID } from "crypto";
import fs, { readFileSync } from "fs";
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
            Logger.error({
                message: `Trying to get current player while step is ${gameData.step.value} instead of round.`,
                path: "Utilitary.class.ts",
            });
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
                    userIsAdmin: (username: string) => {
                        return bot.botData!.adminAccountUsernames.includes(username);
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
                Logger.error({
                    message: "No open handler",
                    path: "Utilitary.class.ts",
                });
                return;
            }
            const eventName = "open";
            bot.enqueueHandler({
                handler: bot.handlers.open,
                ctx: getEventCtx(new Buffer("")),
                eventName: eventName,
            });
        });
        room.ws!.on("close", () => {
            if (!bot.handlers.close) {
                Logger.error({
                    message: "No close handler",
                    path: "Utilitary.class.ts",
                });
                return;
            }
            const eventName = "close";
            bot.enqueueHandler({
                handler: bot.handlers.close,
                ctx: getEventCtx(new Buffer("")),
                eventName: eventName,
            });
        });
        room.ws!.on("message", (message: Buffer) => {
            const baseMessageData = bot.networkAdapter.readNodeMessageBaseData(message);
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

            bot.enqueueHandler({
                handler: handler,
                ctx: getEventCtx(message),
                eventName: eventName,
            });
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

    public static readArrayFromFile(path: string) {
        const fileText = readFileSync(path, "utf-8");
        const words = fileText.split(/\r?\n/);
        return words.map((word) => word.trim()).filter((word) => word.length > 0);
    }

    public static handleCommandIfExists(
        ctx: EventCtx,
        rawMessage: string,
        gamerAccountName: string | null,
        commands: Command[]
    ):
        | "no-command-given"
        | "command-not-found"
        | "command-handled"
        | "no-command-attempted"
        | "invalid-arguments"
        | "not-room-creator" {
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
            if (
                !(
                    (command.roomCreatorRequired &&
                        ctx.room.constantRoomData.roomCreatorUsername === gamerAccountName) ||
                    ctx.utils.userIsAdmin(gamerAccountName)
                )
            ) {
                ctx.utils.sendChatMessage("This command is only available for the room creator.");
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
                normalizedMessage,
                usedAlias: requestedCommand,
            };
            const commandStatus = command.handler(commandHandlerCtx);
            if (commandStatus === "handled") return "command-handled";
            if (commandStatus === "invalid-arguments") return "invalid-arguments";
        }
        return "no-command-attempted";
    }
}
