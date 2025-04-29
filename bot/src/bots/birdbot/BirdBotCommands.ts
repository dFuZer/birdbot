import type { Command } from "../../lib/class/CommandUtils.class";
import CommandUtils from "../../lib/class/CommandUtils.class";
import Utilitary from "../../lib/class/Utilitary.class";
import {
    birdbotLanguageToDictionaryId,
    birdbotModeRules,
    birdbotSupportedDictionaryIds,
    defaultLanguage,
    defaultMode,
    dictionaryIdToBirdbotLanguage,
    languageAliases,
    languageDisplayStrings,
    languageFlagMap,
    modeDisplayStrings,
    modesEnumSchema,
    recordAliases,
    recordsUtils,
} from "./BirdBotConstants";
import { BirdBotLanguage, BirdBotRoomMetadata, BirdBotSupportedDictionaryId, DictionaryResource } from "./BirdBotTypes";
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
            const commandFirstAliases = birdbotCommands
                .filter((command) => !command.adminRequired)
                .map((c) => `/${c.aliases[0]}`)
                .join(" - ");
            ctx.utils.sendChatMessage(
                `${commandFirstAliases} — For more information about a command, use /help [command]`
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
            `/${command.aliases[0]}: ${command.desc} — Use: ${command.usageDesc} — Ex. ${command.exampleUsage}`
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
        const targetLanguage = BirdBotUtils.findValueInAliasesObject(allArguments, languageAliases);
        const targetMode = BirdBotUtils.findTargetItemInZodEnum(allArguments, modesEnumSchema);
        const targetRecordType = BirdBotUtils.findValueInAliasesObject(allArguments, recordAliases);
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
    aliases: ["score", "s", "sc", "j", "joueur"],
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

const startGameCommand: Command = c({
    id: "startGame",
    aliases: ["startnow", "sn"],
    desc: "Starts the game.",
    usageDesc: "/sn",
    exampleUsage: "/sn",
    handler: (ctx) => {
        if (ctx.room.roomState.gameData!.step.value !== "pregame") {
            ctx.utils.sendChatMessage("Error: Not in pregame.");
            return "handled";
        }
        if (ctx.room.roomState.gameData!.players.length < 2) {
            ctx.utils.sendChatMessage("Error: Not enough players to start the game.");
            return "handled";
        }
        const startGameMessage = ctx.bot.networkAdapter.getStartGameMessage();
        ctx.room.ws!.send(startGameMessage);
        ctx.utils.sendChatMessage("Starting game...");
        return "handled";
    },
});

const setGameModeCommand: Command = c({
    id: "setGameMode",
    aliases: ["mode", "m"],
    desc: "Sets the game mode.",
    usageDesc: "/mode [gameMode]",
    exampleUsage: "/mode survival",
    roomCreatorRequired: true,
    handler: (ctx) => {
        if (ctx.room.roomState.gameData!.step.value !== "pregame") {
            ctx.utils.sendChatMessage("Error: Cannot set mode outside of pregame.");
            return "handled";
        }
        const targetGameMode = BirdBotUtils.findTargetItemInZodEnum(ctx.args, modesEnumSchema);
        if (targetGameMode) {
            const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
            if (roomMetadata.gameMode === targetGameMode) {
                ctx.utils.sendChatMessage(`Game mode is already ${modeDisplayStrings[targetGameMode]}.`);
                return "handled";
            }
            ctx.utils.sendChatMessage(`Setting mode to ${modeDisplayStrings[targetGameMode]}...`);
            const targetGameModeRules = birdbotModeRules[targetGameMode];

            BirdBotUtils.setRoomGameMode(ctx, targetGameModeRules);

            return "handled";
        } else {
            ctx.utils.sendChatMessage("Error: Invalid game mode.");
            return "handled";
        }
    },
});

const setRoomLanguageCommand: Command = c({
    id: "setRoomLanguage",
    aliases: ["language", "lang", "l"],
    desc: "Sets the language of the room.",
    usageDesc: "/language [language]",
    exampleUsage: "/language fr",
    roomCreatorRequired: true,
    handler: (ctx) => {
        if (ctx.room.roomState.gameData!.step.value !== "pregame") {
            ctx.utils.sendChatMessage("Error: Cannot set language outside of pregame.");
            return "handled";
        }

        const targetLanguage = BirdBotUtils.findValueInAliasesObject(ctx.params, languageAliases);

        if (targetLanguage) {
            if (ctx.room.roomState.gameData!.rules.dictionaryId === targetLanguage) {
                ctx.utils.sendChatMessage(`Error: Language is already ${languageDisplayStrings[targetLanguage]}.`);
                return "handled";
            }
            ctx.utils.sendChatMessage(`Setting language to ${languageDisplayStrings[targetLanguage]}.`);
            BirdBotUtils.setRoomGameRuleIfDifferent(ctx, "dictionaryId", birdbotLanguageToDictionaryId[targetLanguage]);
            return "handled";
        } else {
            ctx.utils.sendChatMessage("Error: Invalid language.");
            return "handled";
        }
    },
});

const searchWordsCommand: Command = c({
    id: "searchWords",
    aliases: ["c", "searchwords", "words"],
    desc: "Search for words in the dictionary. The user can provide any number of syllables or regexes to search for.",
    usageDesc: "/c [syllable|regex] [...]",
    exampleUsage: "/c hello - /c ^hello$",
    handler: (ctx) => {
        const paramLanguage = BirdBotUtils.findValueInAliasesObject(ctx.params, languageAliases);
        const paramRecord = BirdBotUtils.findValueInAliasesObject(ctx.params, recordAliases);

        let targetLanguage: BirdBotLanguage | null = null;
        if (paramLanguage) {
            targetLanguage = paramLanguage;
        } else {
            const roomDictionaryId = ctx.room.roomState.gameData!.rules.dictionaryId;
            if (!birdbotSupportedDictionaryIds.includes(roomDictionaryId as any)) {
                ctx.utils.sendChatMessage("Error: This language is not supported.");
                return "handled";
            }
            const roomBirdBotLanguage = dictionaryIdToBirdbotLanguage[roomDictionaryId as BirdBotSupportedDictionaryId];
            targetLanguage = roomBirdBotLanguage;
        }

        const dictionaryResource = ctx.bot.getResource<DictionaryResource>(`dictionary-${targetLanguage}`);
        const dictionary = dictionaryResource.resource;

        const regexes: RegExp[] = [];
        for (const arg of ctx.args) {
            try {
                const reg = new RegExp(arg);
                regexes.push(reg);
            } catch (e) {
                ctx.utils.sendChatMessage(`Error: Invalid regex: ${arg}`);
                return "handled";
            }
        }

        const otherRoomPrompts: string[] = [];
        const rooms = Object.values(ctx.bot.rooms);
        for (const room of rooms) {
            const roomSyllable = room.roomState.gameData?.round.prompt;
            if (roomSyllable) {
                otherRoomPrompts.push(roomSyllable);
            }
        }
        function isWordHidden(word: string) {
            return otherRoomPrompts.some((prompt) => word.includes(prompt));
        }

        function isWordValid(word: string) {
            return regexes.every((regex) => regex.test(word));
        }

        const RESULT_LIMIT = 500;
        const TOTAL_CHARACTER_LIMIT = 120;
        let hiddenWordsCount = 0;
        const foundWords: string[] = [];

        function shouldStopSearchingWords() {
            return hiddenWordsCount + foundWords.length > RESULT_LIMIT;
        }

        function searchForWordsInDictionary(startIndex: number, endIndex: number) {
            for (let i = startIndex; i < endIndex; i++) {
                const word = dictionary[i];
                const wordValid = isWordValid(word);

                if (wordValid) {
                    const wordHidden = isWordHidden(word);
                    if (wordHidden) {
                        console.log(word, "hidden");
                        hiddenWordsCount++;
                    } else {
                        foundWords.push(word);
                    }
                    if (shouldStopSearchingWords()) {
                        return;
                    }
                }
            }
        }

        const randomStartIndex = Math.floor(Math.random() * dictionary.length);
        searchForWordsInDictionary(randomStartIndex, dictionary.length);
        const shouldKeepSearching = !shouldStopSearchingWords();
        if (shouldKeepSearching) {
            searchForWordsInDictionary(0, randomStartIndex);
        }
        const cutResults = [];
        let nonHiddenWordsCharacterCount = 0;
        for (const word of foundWords) {
            cutResults.push(word);
            nonHiddenWordsCharacterCount += word.length;
            if (nonHiddenWordsCharacterCount > TOTAL_CHARACTER_LIMIT) {
                break;
            }
        }
        const totalResultsCount = hiddenWordsCount + foundWords.length;
        const foundMoreThanLimit = totalResultsCount > RESULT_LIMIT;
        const moreHiddenThanLimit = hiddenWordsCount > RESULT_LIMIT;

        ctx.utils.sendChatMessage(
            `[${foundMoreThanLimit ? `+${RESULT_LIMIT}` : totalResultsCount} (${
                moreHiddenThanLimit ? `+${RESULT_LIMIT}` : hiddenWordsCount
            } hidden)] ${cutResults.length > 0 ? cutResults.join(" ").toUpperCase() : "No results available"}`
        );
        return "handled";
    },
});

export const birdbotCommands: Command[] = [
    helpCommand,
    recordsCommand,
    currentGameScoresCommand,
    startGameCommand,
    setGameModeCommand,
    setRoomLanguageCommand,
    searchWordsCommand,
];
