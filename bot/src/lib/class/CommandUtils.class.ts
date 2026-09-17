import type { Chatter } from "../types/gameTypes";
import type { BotEventCtx, EventCtx, EventCtxUtils, RoomEventCtx } from "../types/libEventTypes";
import Logger from "./Logger.class";

export type CommandHandlerCtx = {
    rawMessage: string;
    normalizedMessage: string;
    usedAlias: string;
    args: string[];
    params: string[];
    normalizedTextAfterCommand: string;
    source: CommandSource;
    bot: BotEventCtx;
    room: RoomEventCtx;
    utils: EventCtxUtils;
    /** Room participant who issued the command */
    gamer: Chatter;
};

export type CommandOrEventCtx = CommandHandlerCtx | EventCtx;

export type CommandHandler = (commandCtx: CommandHandlerCtx) => void | Promise<void>;

export type CommandSource = "chat" | "word-input";

export type Command = {
    id: string;
    usageDesc: string;
    handler: CommandHandler;
    aliases: [string, ...string[]];
    adminRequired: boolean;
    roomCreatorRequired: boolean;
    exampleUsage: string;
    hidden: boolean;
    /** Whether the command may be used after a round has started. */
    accessibleInRound: boolean;
    /** Whether the command may be dispatched from a submitted game word. */
    allowedFromWordInput: boolean;
    /** Per-user, per-room delay in milliseconds. Zero disables throttling. */
    cooldown: number;
};

export type CommandDispatchResult =
    | "no-command-given"
    | "command-not-found"
    | "trying-to-handle-command"
    | "no-command-attempted"
    | "not-room-creator"
    | "not-admin"
    | "not-accessible-in-round"
    | "not-allowed-from-word-input"
    | "cooldown";

export type CommandRegistry = Readonly<{
    commands: readonly Command[];
    commandsByAlias: ReadonlyMap<string, Command>;
}>;

/** BBV7 INGAME_SAFE_COMMANDS equivalent — used when scores are eligible. */
export const RANKED_WORD_INPUT_SAFE_COMMAND_IDS: ReadonlySet<string> = new Set([
    "currentGameScore",
    "getDefinition",
    "playerProfile",
    "playerRecords",
    "records",
    "showTime",
    "speedRecords",
    "accuracyRecords",
    "publicRoom",
    "privateRoom",
    "getBomb",
    "train",
    "createRoom",
]);

export default class CommandUtils {
    public static DEFAULT_COMMAND_DESCRIPTION = "No description provided for this command";
    public static DEFAULT_COMMAND_USAGE_DESCRIPTION = "No usage description provided for this command";
    public static DEFAULT_COMMAND_EXAMPLE_USAGE = "No example usage provided for this command";
    public static DEFAULT_COMMAND_COOLDOWN = 1500;
    public static GLOBAL_COMMAND_THROTTLE_MS = 1500;
    private static readonly cooldowns = new Map<string, number>();
    private static readonly globalThrottles = new Map<string, number>();
    private static readonly registries = new WeakMap<readonly Command[], CommandRegistry>();

    public static createCommandHelper({
        id,
        aliases,
        usageDesc = CommandUtils.DEFAULT_COMMAND_USAGE_DESCRIPTION,
        exampleUsage = CommandUtils.DEFAULT_COMMAND_EXAMPLE_USAGE,
        handler,
        adminRequired = false,
        roomCreatorRequired = false,
        hidden = false,
        accessibleInRound = false,
        allowedFromWordInput = false,
        cooldown = CommandUtils.DEFAULT_COMMAND_COOLDOWN,
    }: {
        id: string;
        aliases: Command["aliases"];
        usageDesc: Command["usageDesc"];
        handler: Command["handler"];
        adminRequired?: Command["adminRequired"];
        roomCreatorRequired?: Command["roomCreatorRequired"];
        exampleUsage?: Command["exampleUsage"];
        hidden?: Command["hidden"];
        accessibleInRound?: Command["accessibleInRound"];
        allowedFromWordInput?: Command["allowedFromWordInput"];
        cooldown?: Command["cooldown"];
    }) {
        if (!Number.isFinite(cooldown) || cooldown < 0) {
            throw new Error(`Command "${id}" has an invalid cooldown: ${cooldown}`);
        }
        return {
            id,
            aliases,
            usageDesc,
            handler,
            adminRequired,
            roomCreatorRequired,
            exampleUsage,
            hidden,
            accessibleInRound,
            allowedFromWordInput,
            cooldown,
        } satisfies Command;
    }

    public static createRegistry(commands: readonly Command[]): CommandRegistry {
        const commandsByAlias = new Map<string, Command>();
        const commandIds = new Set<string>();

        for (const command of commands) {
            if (commandIds.has(command.id)) {
                throw new Error(`Duplicate command id "${command.id}"`);
            }
            commandIds.add(command.id);

            for (const rawAlias of command.aliases) {
                const alias = rawAlias.trim().toLowerCase();
                if (!alias || alias !== rawAlias) {
                    throw new Error(`Command "${command.id}" has an invalid alias "${rawAlias}"`);
                }
                const existing = commandsByAlias.get(alias);
                if (existing) {
                    throw new Error(
                        `Duplicate command alias "${alias}" used by "${existing.id}" and "${command.id}"`,
                    );
                }
                commandsByAlias.set(alias, command);
            }
        }

        const registry = Object.freeze({
            commands: Object.freeze([...commands]),
            commandsByAlias,
        });
        CommandUtils.registries.set(registry.commands, registry);
        return registry;
    }

    public static getRegistry(commands: readonly Command[]): CommandRegistry {
        return CommandUtils.registries.get(commands) ?? CommandUtils.createRegistry(commands);
    }

    public static dispatch({
        ctx,
        rawMessage,
        chatter,
        registry,
        source = ctx.message.event === "failWord" ? "word-input" : "chat",
        isScoreEligible = false,
    }: {
        ctx: EventCtx;
        rawMessage: string;
        chatter: Chatter;
        registry: CommandRegistry;
        source?: CommandSource;
        isScoreEligible?: boolean;
    }): CommandDispatchResult {
        const normalizedMessage = rawMessage.trim().replace(/[ ]+/g, " ");
        const commandPrefixes = ["!", "/", "."];
        if (!commandPrefixes.some((prefix) => normalizedMessage.startsWith(prefix))) {
            return "no-command-attempted";
        }

        const messageParts = normalizedMessage.slice(1).split(" ");
        const requestedCommand = messageParts[0]?.toLowerCase();
        if (!requestedCommand) return "no-command-given";

        const command = registry.commandsByAlias.get(requestedCommand);
        if (!command) return "command-not-found";
        if (source === "word-input") {
            if (!command.allowedFromWordInput) return "not-allowed-from-word-input";
            if (isScoreEligible && !RANKED_WORD_INPUT_SAFE_COMMAND_IDS.has(command.id)) {
                return "not-allowed-from-word-input";
            }
        }
        if (ctx.room.roomState.gameData?.milestone.name === "round" && !command.accessibleInRound) {
            return "not-accessible-in-round";
        }
        if (command.adminRequired && !ctx.utils.userIsAdmin(chatter.authId)) {
            return "not-admin";
        }
        if (command.roomCreatorRequired && !ctx.utils.userIsAdmin(chatter.authId)) {
            const roomCreatorAuthId = ctx.room.constantRoomData.roomCreatorAuthId;
            if (roomCreatorAuthId === null) {
                return "not-admin";
            }
            if (chatter.authId === null || roomCreatorAuthId !== chatter.authId) {
                return "not-room-creator";
            }
        }

        const now = Date.now();
        const identity = chatter.authId ?? `peer:${chatter.peerId}`;
        const roomCode = ctx.room.constantRoomData.roomCode;
        const globalKey = `${roomCode}:${identity}`;
        const globalEndsAt = CommandUtils.globalThrottles.get(globalKey) ?? 0;
        if (globalEndsAt > now) {
            return "cooldown";
        }

        const cooldownKey = `${roomCode}:${identity}:${command.id}`;
        const cooldownEndsAt = CommandUtils.cooldowns.get(cooldownKey) ?? 0;
        if (command.cooldown > 0 && cooldownEndsAt > now) {
            return "cooldown";
        }

        CommandUtils.globalThrottles.set(globalKey, now + CommandUtils.GLOBAL_COMMAND_THROTTLE_MS);
        if (command.cooldown > 0) {
            CommandUtils.cooldowns.set(cooldownKey, now + command.cooldown);
        }

        const params = messageParts
            .slice(1)
            .filter((arg) => arg.startsWith("-"))
            .map((arg) => arg.slice(1).toLowerCase());
        const args = messageParts
            .slice(1)
            .filter((arg) => !arg.startsWith("-"))
            .map((arg) => arg.toLowerCase());

        const commandHandlerCtx: CommandHandlerCtx = {
            bot: ctx.bot,
            room: ctx.room,
            utils: ctx.utils,
            rawMessage,
            params,
            args,
            gamer: chatter,
            normalizedMessage,
            usedAlias: requestedCommand,
            normalizedTextAfterCommand: normalizedMessage.slice(requestedCommand.length + 1).trim(),
            source,
        };
        try {
            const result = command.handler(commandHandlerCtx);
            if (result && typeof (result as Promise<void>).then === "function") {
                void (result as Promise<void>).catch((error) => {
                    Logger.error({
                        message: `Async command handler failed for ${command.id}`,
                        path: "CommandUtils.class.ts",
                        error,
                    });
                    ctx.utils.sendChatMessage(
                        `Could not execute command "${command.id}".`,
                        "error",
                    );
                });
            }
        } catch (error) {
            Logger.error({
                message: `Command handler failed for ${command.id}`,
                path: "CommandUtils.class.ts",
                error,
            });
            ctx.utils.sendChatMessage(`Could not execute command "${command.id}".`, "error");
        }
        return "trying-to-handle-command";
    }
}
