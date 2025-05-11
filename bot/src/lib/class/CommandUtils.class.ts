import { Gamer } from "../types/gameTypes";
import type { BotEventCtx, EventCtx, EventCtxUtils, RoomEventCtx } from "../types/libEventTypes";

export type CommandHandlerCtx = {
    rawMessage: string;
    normalizedMessage: string;
    usedAlias: string;
    args: string[];
    params: string[];
    normalizedTextAfterCommand: string;
    bot: BotEventCtx;
    room: RoomEventCtx;
    utils: EventCtxUtils;
    gamer: Gamer;
};

export type CommandOrEventCtx = CommandHandlerCtx | EventCtx;

export type CommandHandler = (commandCtx: CommandHandlerCtx) => void;

export type Command = {
    id: string;
    usageDesc: string;
    handler: CommandHandler;
    aliases: [string, ...string[]];
    adminRequired: boolean;
    roomCreatorRequired: boolean;
    exampleUsage: string;
    hidden: boolean;
};

export default class CommandUtils {
    public static DEFAULT_COMMAND_DESCRIPTION = "No description provided for this command";
    public static DEFAULT_COMMAND_USAGE_DESCRIPTION = "No usage description provided for this command";
    public static DEFAULT_COMMAND_EXAMPLE_USAGE = "No example usage provided for this command";

    public static createCommandHelper({
        id,
        aliases,
        usageDesc = CommandUtils.DEFAULT_COMMAND_USAGE_DESCRIPTION,
        exampleUsage = CommandUtils.DEFAULT_COMMAND_EXAMPLE_USAGE,
        handler,
        adminRequired = false,
        roomCreatorRequired = false,
        hidden = false,
    }: {
        id: string;
        aliases: Command["aliases"];
        usageDesc: Command["usageDesc"];
        handler: Command["handler"];
        adminRequired?: Command["adminRequired"];
        roomCreatorRequired?: Command["roomCreatorRequired"];
        exampleUsage?: Command["exampleUsage"];
        hidden?: Command["hidden"];
    }) {
        return {
            id,
            aliases,
            usageDesc,
            handler,
            adminRequired,
            roomCreatorRequired,
            exampleUsage,
            hidden,
        } satisfies Command;
    }
}
