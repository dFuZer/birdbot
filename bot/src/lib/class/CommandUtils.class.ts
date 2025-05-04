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
};

export type CommandOrEventCtx = CommandHandlerCtx | EventCtx;

export type CommandHandler = (commandCtx: CommandHandlerCtx) => void;

export type Command = {
    id: string;
    desc: string;
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
        desc = CommandUtils.DEFAULT_COMMAND_DESCRIPTION,
        usageDesc = CommandUtils.DEFAULT_COMMAND_USAGE_DESCRIPTION,
        exampleUsage = CommandUtils.DEFAULT_COMMAND_EXAMPLE_USAGE,
        handler,
        adminRequired = false,
        roomCreatorRequired = false,
        hidden = false,
    }: {
        id: Command["id"];
        aliases: Command["aliases"];
        usageDesc: Command["usageDesc"];
        desc?: Command["desc"];
        handler: Command["handler"];
        adminRequired?: Command["adminRequired"];
        roomCreatorRequired?: Command["roomCreatorRequired"];
        exampleUsage?: Command["exampleUsage"];
        hidden?: Command["hidden"];
    }): Command {
        return {
            id,
            aliases,
            desc,
            usageDesc,
            handler,
            adminRequired,
            roomCreatorRequired,
            exampleUsage,
            hidden,
        };
    }
}
