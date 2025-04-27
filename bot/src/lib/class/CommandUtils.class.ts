import type { BotEventCtx, EventCtx, EventCtxUtils, RoomEventCtx } from "../types/libEventTypes";

export type CommandHandlerCtx = {
    rawMessage: string;
    normalizedMessage: string;
    usedAlias: string;
    args: string[];
    params: string[];
    bot: BotEventCtx;
    room: RoomEventCtx;
    utils: EventCtxUtils;
};

export type CommandOrEventCtx = CommandHandlerCtx | EventCtx;

export type CommandStatus = "handled" | "invalid-arguments";
export type CommandHandler = (commandCtx: CommandHandlerCtx) => CommandStatus | Promise<CommandStatus>;

export type Command = {
    id: string;
    desc: string;
    usageDesc: string;
    handler: CommandHandler;
    aliases: [string, ...string[]];
    adminRequired: boolean;
    roomCreatorRequired: boolean;
    exampleUsage: string;
};

export default class CommandUtils {
    static DEFAULT_COMMAND_DESCRIPTION = "No description provided for this command";
    static DEFAULT_COMMAND_USAGE_DESCRIPTION = "No usage description provided for this command";
    static DEFAULT_COMMAND_EXAMPLE_USAGE = "No example usage provided for this command";
    public static createCommandHelper({
        id,
        aliases,
        desc = this.DEFAULT_COMMAND_DESCRIPTION,
        usageDesc = this.DEFAULT_COMMAND_USAGE_DESCRIPTION,
        exampleUsage = this.DEFAULT_COMMAND_EXAMPLE_USAGE,
        handler,
        adminRequired = false,
        roomCreatorRequired = false,
    }: {
        id: Command["id"];
        aliases: Command["aliases"];
        usageDesc: Command["usageDesc"];
        desc?: Command["desc"];
        handler: Command["handler"];
        adminRequired?: Command["adminRequired"];
        roomCreatorRequired?: Command["roomCreatorRequired"];
        exampleUsage?: Command["exampleUsage"];
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
        };
    }
}
