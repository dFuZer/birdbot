import type { Command } from "../../lib/class/CommandUtils.class";
import CommandUtils from "../../lib/class/CommandUtils.class";
import Utilitary from "../../lib/class/Utilitary.class";
import {
    defaultLanguage,
    defaultMode,
    languageEnumSchema,
    languageFlagMap,
    modeDisplayStrings,
    modesEnumSchema,
    recordsEnumSchema,
    recordsUtils,
} from "./BirdBotConstants";
import type { BirdBotRoomMetadata } from "./BirdBotResources";
import BirdBotUtils, {
    type ApiResponseAllRecords,
    type ApiResponseBestScoresSpecificRecord,
} from "./BirdBotUtils.class";

const c = CommandUtils.createCommandHelper;

const helpCommand: Command = c({
    id: "help",
    aliases: ["help", "h", "?", "helo"], // Not a typo, helo may be a misinput of help
    desc: "Shows the list of commands. If a command is provided, it will show the description of that command.",
    usageDesc: "/help - /help [command]",
    exampleUsage: "/help - /help records",
    handler: (ctx) => {
        if (ctx.args.length === 0) {
            const commandFirstAliases = birdbotCommands.map((c) => `/${c.aliases[0]}`).join(" - ");
            ctx.utils.sendChatMessage(
                `${commandFirstAliases} —— For more information about a command, use /help [command]`
            );
            return "handled";
        }
        const requestedCommand = ctx.args[0]!;
        const command = birdbotCommands.find((c) => c.aliases.includes(requestedCommand));
        if (!command) {
            ctx.utils.sendChatMessage(`Command not found: ${requestedCommand}`);
            return "handled";
        }
        ctx.utils.sendChatMessage(
            `/${command.aliases[0]}: ${command.desc} —— Usage: ${command.usageDesc} —— Example usage: ${command.exampleUsage}`
        );
        return "handled";
    },
});

const recordsCommand: Command = c({
    id: "records",
    aliases: ["records", "r", "recs", "rec", "record"],
    desc: "Shows the list of records.",
    usageDesc: "/records - /records [recordType]",
    exampleUsage: "/records - /records words",
    handler: async (ctx) => {
        const allArguments = ctx.params.concat(ctx.args);
        const targetLanguage = BirdBotUtils.findTargetItemInZodEnum(allArguments, languageEnumSchema);
        const targetMode = BirdBotUtils.findTargetItemInZodEnum(allArguments, modesEnumSchema);
        const targetRecordType = BirdBotUtils.findTargetItemInZodEnum(allArguments, recordsEnumSchema);
        const targetPage = BirdBotUtils.findNumberInArgs(allArguments);

        const language = targetLanguage ?? defaultLanguage;
        const mode = targetMode ?? defaultMode;

        const records = await BirdBotUtils.getRecordsFromApi({
            language,
            gameMode: mode,
            recordType: targetRecordType ?? undefined,
            page: targetPage ?? undefined,
        });
        if (records === null) {
            ctx.utils.sendChatMessage("Error fetching records");
        } else {
            if (targetRecordType) {
                const r = records as ApiResponseBestScoresSpecificRecord;
                const message = `[${languageFlagMap[language]} ${modeDisplayStrings[mode]} ${
                    recordsUtils[targetRecordType].recordDisplayString
                }] ${r.bestScores
                    .map(
                        (score) =>
                            `${score.rank}) ${score.player_username} with ${recordsUtils[
                                targetRecordType
                            ].scoreDisplayStringGenerator(score.score)}`
                    )
                    .join(" — ")}`;
                ctx.utils.sendChatMessage(message);
            } else {
                const r = records as ApiResponseAllRecords;
                const message = `[${languageFlagMap[language]} ${modeDisplayStrings[mode]}] ${r.bestScores
                    .sort((a, b) => recordsUtils[a.record_type].order - recordsUtils[b.record_type].order)
                    .map((score) => {
                        return `${recordsUtils[score.record_type].recordDisplayString}: ${
                            score.player_username
                        } with ${recordsUtils[score.record_type].scoreDisplayStringGenerator(score.score)}`;
                    })
                    .join(" — ")}`;
                ctx.utils.sendChatMessage(message);
            }
        }
        return "handled" as const;
    },
});

const currentGameScoresCommand: Command = c({
    id: "currentGameScore",
    aliases: ["score", "s", "sc"],
    desc: "Shows the current game scores for a given player. If no player is provided, it will show the scores for the current player.",
    usageDesc: "/score (player)",
    exampleUsage: "/score - /score dfuzer",
    handler: (ctx) => {
        const targetPlayerName = ctx.normalizedMessage.slice(ctx.usedAlias.length + 2);
        if (ctx.room.roomState.gameData!.step.value !== "round") {
            ctx.utils.sendChatMessage("Error: No game in progress.");
            return "handled";
        }
        if (targetPlayerName.length) {
            const bestMatch = BirdBotUtils.findBestUsernameMatch(targetPlayerName, ctx.room.roomState.roomData!.gamers);
            if (bestMatch) {
                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                const playerStats = roomMetadata.scoresByGamerId[bestMatch.id];

                if (playerStats === undefined) {
                    ctx.utils.sendChatMessage("Error: This player has no stats for this game. This should not happen.");
                    return "handled";
                }
                const scores = BirdBotUtils.getFormattedPlayerScores(playerStats);
                ctx.utils.sendChatMessage(`${bestMatch.identity.nickname}: ${scores}`);

                return "handled";
            } else {
                ctx.utils.sendChatMessage("Error: Player not found.");
                return "handled";
            }
        } else {
            const currentPlayer = Utilitary.getCurrentPlayer(ctx.room.roomState.gameData!);
            if (currentPlayer) {
                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                const playerStats = roomMetadata.scoresByGamerId[currentPlayer.gamerId];
                if (playerStats === undefined) {
                    ctx.utils.sendChatMessage("Error: This player has no stats for this game. This should not happen.");
                    return "handled";
                }
                const scores = BirdBotUtils.getFormattedPlayerScores(playerStats);
                const gamer = ctx.room.roomState.roomData!.gamers.find((gamer) => gamer.id === currentPlayer.gamerId);
                if (gamer === undefined) {
                    ctx.utils.sendChatMessage("Error: This gamer was not found in the room. This should not happen.");
                    return "handled";
                }
                ctx.utils.sendChatMessage(`${gamer.identity.nickname}: ${scores}`);
            } else {
                ctx.utils.sendChatMessage("Error: No current player.");
                return "handled";
            }
        }
        return "handled";
    },
});

export const birdbotCommands: Command[] = [helpCommand, recordsCommand, currentGameScoresCommand];
