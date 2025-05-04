import type { Command } from "../../lib/class/CommandUtils.class";
import CommandUtils from "../../lib/class/CommandUtils.class";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { RoomRole } from "../../lib/types/gameTypes";
import BirdBot from "./BirdBot.class";
import {
    birdbotLanguageToDictionaryId,
    birdbotModeRules,
    birdbotSupportedDictionaryIds,
    defaultLanguage,
    defaultMode,
    dictionaryIdToBirdbotLanguage,
    DISCORD_SERVER_LINK,
    filterWordsModeRecords,
    GITHUB_REPO_LINK,
    languageAliases,
    languageDisplayStrings,
    languageFlagMap,
    modeDisplayStrings,
    modesEnumSchema,
    PAYPAL_DONATE_LINK,
    recordAliases,
    recordsUtils,
    sortWordsModeRecords,
    WEBSITE_LINK,
} from "./BirdBotConstants";
import {
    BirdBotGameMode,
    BirdBotLanguage,
    BirdBotRecordType,
    BirdBotRoomMetadata,
    BirdBotSupportedDictionaryId,
    DictionaryResource,
    PlayerGameScores,
} from "./BirdBotTypes";
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
            return;
        }
        const requestedCommand = ctx.args[0]!;
        const command = birdbotCommands.find((c) => c.aliases.includes(requestedCommand));
        if (!command) {
            ctx.utils.sendChatMessage(`Command not found: ${requestedCommand}`);
            return;
        }
        ctx.utils.sendChatMessage(
            `/${command.aliases[0]}: ${command.desc} — Use: ${command.usageDesc} — Ex. ${command.exampleUsage}`
        );
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

        let responseData: ApiResponseBestScoresSpecificRecord | ApiResponseAllRecords | null = null;

        try {
            const recordsRequest = await BirdBotUtils.getRecordsFromApi({
                language,
                gameMode: mode,
                recordType: targetRecordType ?? undefined,
                page: targetPage ?? undefined,
            });

            if (!recordsRequest.ok) {
                if (recordsRequest.status === 500) ctx.utils.sendChatMessage("Error fetching records");
                return;
            }

            const json = (await recordsRequest.json()) as ApiResponseBestScoresSpecificRecord | ApiResponseAllRecords;

            responseData = json;
        } catch (e) {
            Logger.error({
                message: "Error fetching records",
                path: "BirdBotCommands.ts",
                error: e,
            });
            ctx.utils.sendChatMessage("Error fetching records");
            return;
        }

        if (!ctx.room.isHealthy()) {
            Logger.warn({
                message: "Room is not healthy anymore, skipping the rest of command execution",
                path: "BirdBotCommands.ts",
            });
            return;
        }

        if (targetRecordType) {
            const r = responseData as ApiResponseBestScoresSpecificRecord;
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
            const r = responseData as ApiResponseAllRecords;
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
            return;
        }

        function sendResults(username: string, playerStats: PlayerGameScores) {
            const scores = BirdBotUtils.getFormattedPlayerScores(playerStats);
            ctx.utils.sendChatMessage(`${username}: ${scores.length > 0 ? scores : "No scores available"}`);
        }

        if (targetPlayerName.length) {
            const bestMatch = BirdBotUtils.findBestUsernameMatch(targetPlayerName, ctx.room.roomState.roomData!.gamers);
            if (bestMatch) {
                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                const playerStats = roomMetadata.scoresByGamerId[bestMatch.id];

                if (playerStats === undefined) {
                    ctx.utils.sendChatMessage("Error: This player has no stats for this game. This should not happen.");
                    return;
                }
                sendResults(bestMatch.identity.nickname, playerStats);
            } else {
                ctx.utils.sendChatMessage("Error: Player not found.");
            }
        } else {
            const currentPlayer = Utilitary.getCurrentPlayer(ctx.room.roomState.gameData!);
            if (!currentPlayer) {
                ctx.utils.sendChatMessage("Error: No current player.");
                return;
            }
            const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
            const playerStats = roomMetadata.scoresByGamerId[currentPlayer.gamerId];
            if (playerStats === undefined) {
                ctx.utils.sendChatMessage("Error: This player has no stats for this game. This should not happen.");
                return;
            }
            const gamer = ctx.room.roomState.roomData!.gamers.find((gamer) => gamer.id === currentPlayer.gamerId);
            if (gamer === undefined) {
                ctx.utils.sendChatMessage("Error: This gamer was not found in the room. This should not happen.");
                return;
            }
            sendResults(gamer.identity.nickname, playerStats);
        }
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
            return;
        }
        if (ctx.room.roomState.gameData!.players.length < 2) {
            ctx.utils.sendChatMessage("Error: Not enough players to start the game.");
            return;
        }
        const startGameMessage = ctx.bot.networkAdapter.getStartGameMessage();
        ctx.room.ws!.send(startGameMessage);
        ctx.utils.sendChatMessage("Starting game...");
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
            return;
        }
        const targetGameMode = BirdBotUtils.findTargetItemInZodEnum(ctx.args.concat(ctx.params), modesEnumSchema);
        if (targetGameMode) {
            const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
            if (roomMetadata.gameMode === targetGameMode) {
                ctx.utils.sendChatMessage(`Game mode is already ${modeDisplayStrings[targetGameMode]}.`);
                return;
            }
            ctx.utils.sendChatMessage(`Setting mode to ${modeDisplayStrings[targetGameMode]}...`);
            const targetGameModeRules = birdbotModeRules[targetGameMode];

            BirdBotUtils.setRoomGameMode(ctx, targetGameModeRules);
        } else {
            ctx.utils.sendChatMessage("Error: Invalid game mode.");
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
            return;
        }

        const targetLanguage = BirdBotUtils.findValueInAliasesObject(ctx.params.concat(ctx.args), languageAliases);

        if (targetLanguage) {
            if (ctx.room.roomState.gameData!.rules.dictionaryId === targetLanguage) {
                ctx.utils.sendChatMessage(`Error: Language is already ${languageDisplayStrings[targetLanguage]}.`);
                return;
            }
            ctx.utils.sendChatMessage(`Setting language to ${languageDisplayStrings[targetLanguage]}.`);
            BirdBotUtils.setRoomGameRuleIfDifferent(ctx, "dictionaryId", birdbotLanguageToDictionaryId[targetLanguage]);
        } else {
            ctx.utils.sendChatMessage("Error: Invalid language.");
        }
    },
});

const searchWordsCommand: Command = c({
    id: "searchWords",
    aliases: ["searchwords", "c", "words", "search"],
    desc: "Search for words in the dictionary. The user can provide any number of syllables or regexes to search for. The command will return the words that match every given regex.",
    usageDesc: "/c [syllable|regex] [...]",
    exampleUsage: "/c hello - /c ^hello$",
    handler: (ctx) => {
        const paramLanguage = BirdBotUtils.findValueInAliasesObject(ctx.params, languageAliases);
        const allParamRecords = BirdBotUtils.findValuesInAliasesObject(ctx.params, recordAliases);

        const nonSensicalSearchRecords: BirdBotRecordType[] = ["no_death", "word", "time"];
        if (allParamRecords.some((record) => nonSensicalSearchRecords.includes(record))) {
            ctx.utils.sendChatMessage(
                `Error: It makes no sense to sort words by record(s): ${allParamRecords
                    .map((record) => recordsUtils[record].recordDisplayString)
                    .join(", ")}.`
            );
            return;
        }

        if (allParamRecords.includes("previous_syllable")) {
            ctx.utils.sendChatMessage(
                `Instead of filtering words for the ${recordsUtils["previous_syllable"].recordDisplayString} record, you should provide multiple regexes. Example: /c ER FA, if ER is the current prompt and FA the previous prompt.`
            );
            return;
        }
        if (allParamRecords.includes("alpha")) {
            ctx.utils.sendChatMessage(
                `Instead of filtering words for the ${recordsUtils["alpha"].recordDisplayString} record, you should provide multiple regexes. Example: /c ^E FA, if E is the current alpha letter and FA is the current prompt.`
            );
            return;
        }

        const requestedFilterRecords = Utilitary.getUniqueStrings(
            allParamRecords.filter((record) =>
                filterWordsModeRecords.includes(record as any)
            ) as (typeof filterWordsModeRecords)[number][]
        );
        const requestedSortRecords = Utilitary.getUniqueStrings(
            allParamRecords.filter((record) =>
                sortWordsModeRecords.includes(record as any)
            ) as (typeof sortWordsModeRecords)[number][]
        );
        if (requestedSortRecords.length > 1) {
            ctx.utils.sendChatMessage(
                `Error: You can only sort by one sort-record at a time. The sort-records are: ${sortWordsModeRecords
                    .map((record) => recordsUtils[record].recordDisplayString)
                    .join(
                        ", "
                    )}. Note that you can still filter by multiple filter-records. The filter-records are: ${filterWordsModeRecords
                    .map((record) => recordsUtils[record].recordDisplayString)
                    .join(", ")}.`
            );
            return;
        }

        let targetLanguage: BirdBotLanguage | null = null;
        if (paramLanguage) {
            targetLanguage = paramLanguage;
        } else {
            const roomDictionaryId = ctx.room.roomState.gameData!.rules.dictionaryId;
            if (!birdbotSupportedDictionaryIds.includes(roomDictionaryId as any)) {
                ctx.utils.sendChatMessage("Error: This language is not supported.");
                return;
            }
            const roomBirdBotLanguage = dictionaryIdToBirdbotLanguage[roomDictionaryId as BirdBotSupportedDictionaryId];
            targetLanguage = roomBirdBotLanguage;
        }

        let dictionaryResource;
        try {
            dictionaryResource = ctx.bot.getResource<DictionaryResource>(`dictionary-${targetLanguage}`);
        } catch (e) {
            ctx.utils.sendChatMessage("Error: Could not find dictionary for this language.");
            return;
        }
        let searchList: string[];
        let targetMsSyllable: string | null = null;
        if (requestedSortRecords.includes("flips")) {
            searchList = dictionaryResource.metadata.topFlipWords.map((obj) => obj.word);
        } else if (requestedSortRecords.includes("depleted_syllables")) {
            searchList = dictionaryResource.metadata.topSnWords.map((obj) => obj.word);
        } else if (requestedSortRecords.includes("multi_syllable")) {
            if (ctx.args.length > 1) {
                ctx.utils.sendChatMessage(
                    "Error: You can only sort by multi-syllable words if you provide exactly one syllable."
                );
                return;
            }
            const syllable = ctx.args[0];
            const syllCount = dictionaryResource.metadata.syllablesCount[syllable];
            if (syllCount === undefined) {
                ctx.utils.sendChatMessage("Error: This syllable does not exist in the requested dictionary.");
                return;
            }
            targetMsSyllable = syllable;
            searchList = dictionaryResource.resource;
        } else {
            searchList = dictionaryResource.resource;
        }

        const regexes: RegExp[] = [];
        for (const arg of ctx.args) {
            try {
                const reg = new RegExp(arg);
                regexes.push(reg);
            } catch (e) {
                ctx.utils.sendChatMessage(`Error: Invalid regex: ${arg}`);
                return;
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

        const filterFns: ((word: string) => boolean)[] = [];
        if (requestedFilterRecords.includes("hyphen")) {
            filterFns.push((word) => word.includes("-"));
        }
        if (requestedFilterRecords.includes("more_than_20_letters")) {
            filterFns.push((word) => word.length >= 20);
        }
        if (targetMsSyllable) {
            filterFns.push((word) => word.includes(targetMsSyllable));
        }

        function isWordValid(word: string) {
            return regexes.every((regex) => regex.test(word)) && filterFns.every((filterFn) => filterFn(word));
        }

        const RESULT_LIMIT = 500;
        const TOTAL_CHARACTER_LIMIT = 120;
        const shouldSearchAllValidWords = targetMsSyllable !== null;

        let hiddenWordsCount = 0;
        let foundWords: string[] = [];

        function shouldStopSearchingWords() {
            return !shouldSearchAllValidWords && hiddenWordsCount + foundWords.length > RESULT_LIMIT;
        }

        function searchForWordsInDictionary(startIndex: number, endIndex: number) {
            for (let i = startIndex; i < endIndex; i++) {
                const word = searchList[i];
                const wordValid = isWordValid(word);

                if (wordValid) {
                    const wordHidden = isWordHidden(word);
                    if (wordHidden) {
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

        const shouldStartFromRandomIndex = requestedSortRecords.length === 0;

        if (shouldStartFromRandomIndex) {
            const randomStartIndex = Math.floor(Math.random() * searchList.length);
            searchForWordsInDictionary(randomStartIndex, searchList.length);
            const shouldKeepSearching = !shouldStopSearchingWords();
            if (shouldKeepSearching) {
                searchForWordsInDictionary(0, randomStartIndex);
            }
        } else {
            searchForWordsInDictionary(0, searchList.length);
        }

        if (targetMsSyllable) {
            foundWords = foundWords
                .map((word) => ({ word, score: word.split(targetMsSyllable).length - 1 }))
                .filter((x) => x.score > 1)
                .sort((a, b) => b.score - a.score)
                .map((x) => x.word);
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

        const targetRecordsString =
            requestedFilterRecords.length || requestedSortRecords.length
                ? `${requestedFilterRecords
                      .map((record) => recordsUtils[record].recordDisplayString)
                      .concat(requestedSortRecords.map((record) => recordsUtils[record].recordDisplayString))
                      .join(", ")}: `
                : "";

        ctx.utils.sendChatMessage(
            `[${targetRecordsString}${foundMoreThanLimit ? `+${RESULT_LIMIT}` : totalResultsCount} res. (${
                moreHiddenThanLimit ? `+${RESULT_LIMIT}` : hiddenWordsCount
            } hidden)] ${cutResults.length > 0 ? cutResults.join(" ").toUpperCase() : "No results available"}`
        );
    },
});

const playerProfileCommand: Command = c({
    id: "playerProfile",
    aliases: ["profile", "p"],
    desc: "Shows the player profile of a given player.",
    usageDesc: "/p [username] (-language -mode)",
    exampleUsage: "/p dfuzer - /p dfuzer -fr - /p dfuzer -fr -regular",
    handler: async (ctx) => {
        const targetUsername = ctx.args.join(" ");
        const targetLanguage = BirdBotUtils.findValueInAliasesObject(ctx.params, languageAliases);
        const targetMode = BirdBotUtils.findTargetItemInZodEnum(ctx.params, modesEnumSchema);

        type ResultType = {
            playerId: string;
            playerAccountName: string;
            playerUsername: string;
            foundUsername: string;
            xp: number;
            language: BirdBotLanguage;
            mode: BirdBotGameMode;
            records: {
                record_type: BirdBotRecordType;
                score: number;
                rank: number;
            }[];
        };

        let playerData: ResultType | null = null;

        try {
            const playerDataRequest = await BirdBotUtils.getJsonFromApi(
                `/player-profile?name=${encodeURIComponent(targetUsername)}${
                    targetLanguage ? `&language=${targetLanguage}` : ""
                }${targetMode ? `&mode=${targetMode}` : ""}`
            );
            if (!playerDataRequest.ok) {
                if (playerDataRequest.status === 404) {
                    ctx.utils.sendChatMessage("Error: Player not found");
                } else {
                    ctx.utils.sendChatMessage("Error fetching player data");
                }
                return;
            }
            playerData = (await playerDataRequest.json()) as ResultType;
        } catch (e) {
            Logger.error({
                message: "Error fetching player data",
                path: "BirdBotCommands.ts",
                error: e,
            });
            ctx.utils.sendChatMessage("Error fetching player data");
            return;
        }

        if (!ctx.room.isHealthy()) {
            Logger.warn({
                message: "Room is not healthy anymore, skipping the rest of command execution",
                path: "BirdBotCommands.ts",
            });
            return;
        }

        const messageIntroduction = `[${languageFlagMap[playerData.language]} ${modeDisplayStrings[playerData.mode]}] ${
            playerData.playerUsername
        }:`;

        if (playerData.records.length === 0) {
            ctx.utils.sendChatMessage(`${messageIntroduction} Player has no records in this category`);
            return;
        }

        const message = `${playerData.records
            .sort((a, b) => recordsUtils[a.record_type].order - recordsUtils[b.record_type].order)
            .map((record) => {
                const r = recordsUtils[record.record_type];
                return `${r.recordDisplayString}: ${r.scoreDisplayStringGenerator(record.score)}`;
            })
            .join(" — ")}`;

        ctx.utils.sendChatMessage(`${messageIntroduction} ${message}`);
    },
});

const testCommand: Command = c({
    id: "test",
    aliases: ["test"],
    adminRequired: true,
    usageDesc: "/test",
    hidden: true,
    handler: (ctx) => {
        ctx.room.ws.close();
    },
});

const rareSyllablesCommand: Command = c({
    id: "rareSyllables",
    aliases: ["raresyllables", "raresyll", "rares", "rs"],
    desc: "Shows the rare syllables in the dictionary.",
    usageDesc: "/rareSyllables [word]",
    handler: (ctx) => {
        const paramLanguage = BirdBotUtils.findValueInAliasesObject(ctx.params, languageAliases);
        const targetWord = ctx.args[0];

        if (!targetWord.length) {
            ctx.utils.sendChatMessage("Error: You must provide a word to use this command.");
            return;
        }

        let targetLanguage: BirdBotLanguage | null = null;
        if (paramLanguage) {
            targetLanguage = paramLanguage;
        } else {
            const roomDictionaryId = ctx.room.roomState.gameData!.rules.dictionaryId;
            targetLanguage = dictionaryIdToBirdbotLanguage[roomDictionaryId as BirdBotSupportedDictionaryId];
        }

        const dictionaryResource = ctx.bot.getResource<DictionaryResource>(`dictionary-${targetLanguage}`);
        const dictionaryWords = dictionaryResource.resource;

        if (!dictionaryWords.includes(targetWord)) {
            ctx.utils.sendChatMessage("Error: Word not found in dictionary.");
            return;
        }

        const wordSyllables = BirdBotUtils.splitWordIntoSyllables(targetWord);
        const rareSyllables: { syllable: string; count: number }[] = [];

        for (const syllable in wordSyllables) {
            const syllableCount = wordSyllables[syllable];

            if (syllableCount < 9) {
                rareSyllables.push({ syllable, count: syllableCount });
            }
        }

        ctx.utils.sendChatMessage(
            `[${languageFlagMap[targetLanguage]}] Rare syllables in ${targetWord}: ${
                rareSyllables.length ? rareSyllables.map((s) => `${s.syllable}: ${s.count}`).join(", ") : "None"
            }`
        );
    },
});

const broadcastCommand: Command = c({
    id: "broadcast",
    aliases: ["broadcast", "bc"],
    desc: "Broadcasts a message to all players in all rooms.",
    usageDesc: "/broadcast [message]",
    adminRequired: true,
    hidden: true,
    handler: (ctx) => {
        const message = ctx.args.join(" ");
        for (const roomId in ctx.bot.rooms) {
            const room = ctx.bot.rooms[roomId];
            if (room.ws && room.ws.readyState === WebSocket.OPEN) {
                room.ws.send(ctx.bot.networkAdapter.getSendChatMessage(`Broadcast: ${message}`));
            }
        }
    },
});

const discordCommand: Command = c({
    id: "discord",
    aliases: ["discord"],
    desc: "Gives the discord server link.",
    usageDesc: "/discord",
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            `Discord server: ${DISCORD_SERVER_LINK} - Join the server to get the latest news and updates!`
        );
    },
});

const githubCommand: Command = c({
    id: "github",
    aliases: ["github"],
    desc: "Gives the github repository link.",
    usageDesc: "/github",
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            `Github repository: ${GITHUB_REPO_LINK} - Give a star if you like the project and want to support us!`
        );
    },
});

const donateCommand: Command = c({
    id: "donate",
    aliases: ["donate"],
    desc: "Gives the paypal donation link.",
    usageDesc: "/donate",
    handler: (ctx) => {
        ctx.utils.sendChatMessage(`Paypal donation link: ${PAYPAL_DONATE_LINK} - Thank you so much for your support!`);
    },
});

const websiteCommand: Command = c({
    id: "website",
    aliases: ["website"],
    desc: "Gives the website link.",
    usageDesc: "/website",
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            `Website: ${WEBSITE_LINK} - On the website you will find all the player records, the documentation on the commands, and much more!`
        );
    },
});

const uptimeCommand: Command = c({
    id: "uptime",
    aliases: ["uptime"],
    desc: "Gives the uptime of the bot.",
    usageDesc: "/uptime",
    handler: (ctx) => {
        const uptimeMs = process.uptime() * 1000;
        const uptimeString = Utilitary.formatTime(uptimeMs);
        ctx.utils.sendChatMessage(`Uptime: ${uptimeString}`);
    },
});

const modUserCommand: Command = c({
    id: "modUser",
    aliases: ["mod"],
    desc: "Gives moderator capabilities to the user.",
    roomCreatorRequired: true,
    usageDesc: "/mod [username]",
    handler: (ctx) => {
        const username = ctx.normalizedTextAfterCommand;
        if (!username) {
            ctx.utils.sendChatMessage("Error: You must provide a username to use this command.");
            return;
        }

        const gamer = BirdBotUtils.findBestUsernameMatch(username, ctx.room.roomState.roomData!.gamers);
        if (!gamer) {
            ctx.utils.sendChatMessage("Error: Player not found.");
            return;
        }

        const gamerId = gamer.id;
        const role = "moderator" as RoomRole;

        const message = ctx.bot.networkAdapter.getSetGamerRoleMessage({
            gamerId,
            role,
        });

        ctx.utils.sendChatMessage(`Modding ${gamer.identity.nickname}...`);

        ctx.room.ws.send(message);
    },
});

const unmodUserCommand: Command = c({
    id: "unmodUser",
    aliases: ["unmod"],
    desc: "Removes moderator capabilities from the user.",
    roomCreatorRequired: true,
    usageDesc: "/unmod [username]",
    handler: (ctx) => {
        const username = ctx.normalizedTextAfterCommand;
        if (!username) {
            ctx.utils.sendChatMessage("Error: You must provide a username to use this command.");
            return;
        }

        const gamer = BirdBotUtils.findBestUsernameMatch(username, ctx.room.roomState.roomData!.gamers);
        if (!gamer) {
            ctx.utils.sendChatMessage("Error: Player not found.");
            return;
        }

        const gamerId = gamer.id;
        const role = "" as RoomRole;

        const message = ctx.bot.networkAdapter.getSetGamerRoleMessage({
            gamerId,
            role,
        });

        ctx.utils.sendChatMessage(`Unmodding ${gamer.identity.nickname}...`);

        ctx.room.ws.send(message);
    },
});

const privateRoomCommand: Command = c({
    id: "privateRoom",
    aliases: ["private", "priv"],
    desc: "Creates a private room.",
    usageDesc: "/private",
    adminRequired: true,
    hidden: true,
    handler: (ctx) => {
        const message = ctx.bot.networkAdapter.getSetRoomAccessModeMessage({
            accessMode: "private",
        });
        ctx.utils.sendChatMessage("Setting room to private...");
        ctx.room.ws.send(message);
    },
});

const publicRoomCommand: Command = c({
    id: "publicRoom",
    aliases: ["public", "pub"],
    desc: "Creates a public room.",
    usageDesc: "/public",
    adminRequired: true,
    hidden: true,
    handler: (ctx) => {
        const message = ctx.bot.networkAdapter.getSetRoomAccessModeMessage({
            accessMode: "public",
        });
        ctx.utils.sendChatMessage("Setting room to public...");
        ctx.room.ws.send(message);
    },
});

const destroyAllRoomsCommand: Command = c({
    id: "destroyAllRooms",
    aliases: ["destroy", "destroyall", "destroyallrooms"],
    desc: "Destroys all rooms.",
    usageDesc: "/destroyallrooms",
    adminRequired: true,
    hidden: true,
    handler: (ctx) => {
        for (const roomId in ctx.bot.rooms) {
            const room = ctx.bot.rooms[roomId];

            if (room.ws && room.ws.readyState === WebSocket.OPEN) {
                room.ws.send(
                    ctx.bot.networkAdapter.getSendChatMessage(
                        `Destroying all rooms, probably for maintenance purposes. BirdBot will come back soon!`
                    )
                );
            }

            Utilitary.destroyRoom(ctx.bot.rawBot, room);
        }
    },
});

const showAllRoomsCommand: Command = c({
    id: "showAllRooms",
    aliases: ["rooms", "roomlist", "listrooms", "listroom"],
    desc: "Shows all rooms.",
    usageDesc: "/rooms",
    adminRequired: true,
    hidden: true,
    handler: (ctx) => {
        const roomString = Object.values(ctx.bot.rooms)
            .map((room) => {
                return `${room.constantRoomData.roomCode}: ${
                    room.roomState.gameData?.step.value ?? "gameData unknown"
                }`;
            })
            .join(" - ");

        ctx.utils.sendChatMessage(`Rooms: ${roomString}`);
    },
});

const createRoomCommand: Command = c({
    id: "createRoom",
    aliases: ["createroom", "b"],
    desc: "Creates a room.",
    usageDesc: "/createroom",
    handler: (ctx) => {
        const gamer = ctx.gamer;
        if (!gamer.identity.name) {
            ctx.utils.sendChatMessage(
                `Error: You must be logged in to Croco.games to use this command. To log in, go to the home page at https://croco.games/ and click "Log in" if you have an account or "New account" if you don't.`
            );
            return;
        }
        const allArguments = ctx.args.concat(ctx.params);
        const targetLanguage = BirdBotUtils.findValueInAliasesObject(allArguments, languageAliases);
        const targetMode = BirdBotUtils.findTargetItemInZodEnum(allArguments, modesEnumSchema);

        if (
            targetLanguage !== null &&
            !birdbotSupportedDictionaryIds.includes(birdbotLanguageToDictionaryId[targetLanguage] as any)
        ) {
            ctx.utils.sendChatMessage("Error: This language is not supported by BirdBot.");
            return;
        }

        (ctx.bot.rawBot as BirdBot).createRoom({
            targetConfig: {
                dictionaryId: birdbotLanguageToDictionaryId[targetLanguage ?? defaultLanguage],
                gameMode: "survival",
                birdbotGameMode: targetMode ?? defaultMode,
            },
            roomCreatorUsername: gamer.identity.name,
            callback: (roomCode) => {
                if (ctx.room.isHealthy()) {
                    ctx.room.ws.send(
                        ctx.bot.networkAdapter.getSendChatMessage(`Room created: https://croco.games/${roomCode}`)
                    );
                }
            },
        });
    },
});

export const birdbotCommands: Command[] = [
    helpCommand,
    createRoomCommand,
    recordsCommand,
    playerProfileCommand,
    currentGameScoresCommand,
    searchWordsCommand,
    setGameModeCommand,
    setRoomLanguageCommand,
    startGameCommand,
    modUserCommand,
    unmodUserCommand,
    rareSyllablesCommand,
    privateRoomCommand,
    publicRoomCommand,
    discordCommand,
    githubCommand,
    donateCommand,
    websiteCommand,
    broadcastCommand,
    uptimeCommand,
    testCommand,
    destroyAllRoomsCommand,
    showAllRoomsCommand,
];
