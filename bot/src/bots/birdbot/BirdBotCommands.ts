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
import { l, t } from "./texts/BirdBotTextUtils";

const c = CommandUtils.createCommandHelper;

const helpCommand = c({
    id: "help",
    aliases: ["help", "h", "?", "helo"], // helo may be a misinput of help
    usageDesc: "/help - /help [command]",
    exampleUsage: "/help - /help records",
    handler: (ctx) => {
        if (ctx.args.length === 0) {
            const commandFirstAliases = birdbotCommands
                .filter((command) => !command.adminRequired)
                .map((c) => `/${c.aliases[0]}`)
                .join(" - ");
            ctx.utils.sendChatMessage(
                t("command.help.list", {
                    commandList: commandFirstAliases,
                    lng: l(ctx),
                })
            );
            return;
        }
        const requestedCommand = ctx.args[0]!;
        const command = birdbotCommands.find((c) =>
            c.aliases.includes(requestedCommand)
        );
        if (!command) {
            ctx.utils.sendChatMessage(
                t("eventHandler.chat.commandNotFound", {
                    command: requestedCommand,
                    lng: l(ctx),
                })
            );
            return;
        }
        ctx.utils.sendChatMessage(
            t("command.help.details", {
                commandName: command.aliases[0],
                description: t(`command.${command.id}.description`, {
                    lng: l(ctx),
                }),
                usage: command.usageDesc,
                example: command.exampleUsage,
                lng: l(ctx),
            })
        );
    },
}) satisfies Command;

const recordsCommand = c({
    id: "records",
    aliases: ["records", "r", "recs", "rec", "record"],
    usageDesc: "/records - /records [recordType]",
    exampleUsage: "/records - /records words",
    handler: async (ctx) => {
        const allArguments = ctx.params.concat(ctx.args);
        const targetLanguage = BirdBotUtils.findValueInAliasesObject(
            allArguments,
            languageAliases
        );
        const targetMode = BirdBotUtils.findTargetItemInZodEnum(
            allArguments,
            modesEnumSchema
        );
        const targetRecordType = BirdBotUtils.findValueInAliasesObject(
            allArguments,
            recordAliases
        );
        const targetPage = BirdBotUtils.findNumberInArgs(allArguments);

        const language = targetLanguage ?? defaultLanguage;
        const mode = targetMode ?? defaultMode;

        let responseData:
            | ApiResponseBestScoresSpecificRecord
            | ApiResponseAllRecords
            | null = null;

        try {
            const recordsRequest = await BirdBotUtils.getRecordsFromApi({
                language,
                gameMode: mode,
                recordType: targetRecordType ?? undefined,
                page: targetPage ?? undefined,
            });

            if (!recordsRequest.ok) {
                if (recordsRequest.status === 500)
                    ctx.utils.sendChatMessage(t("error.api.inaccessible"));
                return;
            }

            const json = (await recordsRequest.json()) as
                | ApiResponseBestScoresSpecificRecord
                | ApiResponseAllRecords;

            responseData = json;
        } catch (e) {
            Logger.error({
                message: "Error fetching records",
                path: "BirdBotCommands.ts",
                error: e,
            });
            ctx.utils.sendChatMessage(t("error.api.inaccessible"));
            return;
        }

        if (!ctx.room.isHealthy()) {
            Logger.warn({
                message:
                    "Room is not healthy anymore, skipping the rest of command execution",
                path: "BirdBotCommands.ts",
            });
            return;
        }

        if (targetRecordType) {
            const r = responseData as ApiResponseBestScoresSpecificRecord;
            const records = r.bestScores
                .map(
                    (score) =>
                        `${score.rank}) ${t("general.scorePresentation", {
                            username: score.player_username,
                            score: t(
                                `lib.recordType.${targetRecordType}.score`,
                                {
                                    context: "specific",
                                    count: score.score,
                                    formattedScore: recordsUtils[
                                        targetRecordType
                                    ].format(score.score),
                                    lng: l(ctx),
                                }
                            ),
                            lng: l(ctx),
                        })}`
                )
                .join(" — ");

            ctx.utils.sendChatMessage(
                t("command.records.specificRecord", {
                    languageFlag: t(`lib.language.${language}.flag`),
                    gameMode: t(`lib.mode.${mode}`),
                    recordType: t(
                        `lib.recordType.${targetRecordType}.recordName`
                    ),
                    records,
                    lng: l(ctx),
                })
            );
        } else {
            const r = responseData as ApiResponseAllRecords;
            const records = r.bestScores
                .sort(
                    (a, b) =>
                        recordsUtils[a.record_type].order -
                        recordsUtils[b.record_type].order
                )
                .map((score) => {
                    return `${t(
                        `lib.recordType.${score.record_type}.recordName`
                    )}: ${t("general.scorePresentation", {
                        username: score.player_username,
                        score: t(`lib.recordType.${score.record_type}.score`, {
                            count: score.score,
                            formattedScore: recordsUtils[
                                score.record_type
                            ].format(score.score),
                            lng: l(ctx),
                        }),
                        lng: l(ctx),
                    })}`;
                })
                .join(" — ");

            ctx.utils.sendChatMessage(
                t("command.records.allRecords", {
                    languageFlag: t(`lib.language.${language}.flag`),
                    gameMode: t(`lib.mode.${mode}`),
                    records,
                    lng: l(ctx),
                })
            );
        }
    },
}) satisfies Command;

const currentGameScoresCommand = c({
    id: "currentGameScore",
    aliases: ["score", "s", "sc", "j", "joueur"],
    usageDesc: "/score (player)",
    exampleUsage: "/score - /score dfuzer",
    handler: (ctx) => {
        const targetPlayerName = ctx.normalizedMessage.slice(
            ctx.usedAlias.length + 2
        );
        if (ctx.room.roomState.gameData!.step.value !== "round") {
            ctx.utils.sendChatMessage(t("error.roomState.noGameInProgress"));
            return;
        }

        function sendResults(username: string, playerStats: PlayerGameScores) {
            const scores = BirdBotUtils.getFormattedPlayerScores(
                playerStats,
                l(ctx)
            );
            if (scores.length > 0) {
                ctx.utils.sendChatMessage(
                    t("command.currentGameScore.result", {
                        username,
                        scores,
                        lng: l(ctx),
                    })
                );
            } else {
                ctx.utils.sendChatMessage(
                    t("command.currentGameScore.noScores", {
                        username,
                        lng: l(ctx),
                    })
                );
            }
        }

        if (targetPlayerName.length) {
            const bestMatch = BirdBotUtils.findBestUsernameMatch(
                targetPlayerName,
                ctx.room.roomState.roomData!.gamers
            );
            if (bestMatch) {
                const roomMetadata = ctx.room.roomState
                    .metadata as BirdBotRoomMetadata;
                const playerStats = roomMetadata.scoresByGamerId[bestMatch.id];

                if (playerStats === undefined) {
                    ctx.utils.sendChatMessage(t("error.404.playerStats"));
                    return;
                }
                sendResults(bestMatch.identity.nickname, playerStats);
            } else {
                ctx.utils.sendChatMessage(t("error.404.player"));
            }
        } else {
            const currentPlayer = Utilitary.getCurrentPlayer(
                ctx.room.roomState.gameData!
            );
            if (!currentPlayer) {
                ctx.utils.sendChatMessage(t("error.404.currentPlayer"));
                return;
            }
            const roomMetadata = ctx.room.roomState
                .metadata as BirdBotRoomMetadata;
            const playerStats =
                roomMetadata.scoresByGamerId[currentPlayer.gamerId];
            if (playerStats === undefined) {
                ctx.utils.sendChatMessage(t("error.404.playerStats"));
                return;
            }
            const gamer = ctx.room.roomState.roomData!.gamers.find(
                (gamer) => gamer.id === currentPlayer.gamerId
            );
            if (gamer === undefined) {
                ctx.utils.sendChatMessage(t("error.404.gamer"));
                return;
            }
            sendResults(gamer.identity.nickname, playerStats);
        }
    },
}) satisfies Command;

const startGameCommand = c({
    id: "startGame",
    aliases: ["startnow", "sn"],
    usageDesc: "/sn",
    exampleUsage: "/sn",
    handler: (ctx) => {
        if (ctx.room.roomState.gameData!.step.value !== "pregame") {
            ctx.utils.sendChatMessage(t("error.roomState.notInPregame"));
            return;
        }
        if (ctx.room.roomState.gameData!.players.length < 2) {
            ctx.utils.sendChatMessage(t("error.roomState.notEnoughPlayers"));
            return;
        }
        const startGameMessage = ctx.bot.networkAdapter.getStartGameMessage();
        ctx.room.ws!.send(startGameMessage);
        ctx.utils.sendChatMessage(t("command.startGame.starting"));
    },
}) satisfies Command;

const setGameModeCommand = c({
    id: "setGameMode",
    aliases: ["mode", "m"],
    usageDesc: "/mode [gameMode]",
    exampleUsage: "/mode survival",
    roomCreatorRequired: true,
    handler: (ctx) => {
        if (ctx.room.roomState.gameData!.step.value !== "pregame") {
            ctx.utils.sendChatMessage(t("error.roomState.cannotSetMode"));
            return;
        }
        const targetGameMode = BirdBotUtils.findTargetItemInZodEnum(
            ctx.args.concat(ctx.params),
            modesEnumSchema
        );
        if (targetGameMode) {
            const roomMetadata = ctx.room.roomState
                .metadata as BirdBotRoomMetadata;
            if (roomMetadata.gameMode === targetGameMode) {
                ctx.utils.sendChatMessage(
                    t("command.setGameMode.alreadySet", {
                        gameMode: t(`lib.mode.${targetGameMode}`, {
                            lng: l(ctx),
                        }),
                        lng: l(ctx),
                    })
                );
                return;
            }
            ctx.utils.sendChatMessage(
                t("command.setGameMode.setting", {
                    gameMode: t(`lib.mode.${targetGameMode}`, { lng: l(ctx) }),
                    lng: l(ctx),
                })
            );
            const targetGameModeRules = birdbotModeRules[targetGameMode];

            BirdBotUtils.setRoomGameMode(ctx, targetGameModeRules);
        } else {
            ctx.utils.sendChatMessage(
                t("error.invalid.gameMode", { lng: l(ctx) })
            );
        }
    },
}) satisfies Command;

const setRoomLanguageCommand = c({
    id: "setRoomLanguage",
    aliases: ["language", "lang", "l"],
    usageDesc: "/language [language]",
    exampleUsage: "/language fr",
    roomCreatorRequired: true,
    handler: (ctx) => {
        if (ctx.room.roomState.gameData!.step.value !== "pregame") {
            ctx.utils.sendChatMessage(t("error.roomState.cannotSetLanguage"));
            return;
        }

        const targetLanguage = BirdBotUtils.findValueInAliasesObject(
            ctx.params.concat(ctx.args),
            languageAliases
        );

        if (targetLanguage) {
            if (
                ctx.room.roomState.gameData!.rules.dictionaryId ===
                targetLanguage
            ) {
                ctx.utils.sendChatMessage(
                    t("error.notSupported.language", {
                        language: t(`lib.language.${targetLanguage}.name`, {
                            lng: l(ctx),
                        }),
                        lng: l(ctx),
                    })
                );
                return;
            }
            ctx.utils.sendChatMessage(
                t("command.setRoomLanguage.setting", {
                    language: t(`lib.language.${targetLanguage}.name`, {
                        lng: l(ctx),
                    }),
                    lng: l(ctx),
                })
            );
            BirdBotUtils.setRoomGameRuleIfDifferent(
                ctx,
                "dictionaryId",
                birdbotLanguageToDictionaryId[targetLanguage]
            );
        } else {
            ctx.utils.sendChatMessage(t("error.invalid.language"));
        }
    },
}) satisfies Command;

const searchWordsCommand = c({
    id: "searchWords",
    aliases: ["searchwords", "c", "words", "search"],
    usageDesc: "/c [syllable|regex] [...]",
    exampleUsage: "/c hello - /c ^hello$",
    handler: (ctx) => {
        const paramLanguage = BirdBotUtils.findValueInAliasesObject(
            ctx.params,
            languageAliases
        );
        const allParamRecords = BirdBotUtils.findValuesInAliasesObject(
            ctx.params,
            recordAliases
        );

        const nonSensicalSearchRecords: BirdBotRecordType[] = [
            "no_death",
            "word",
            "time",
        ];
        if (
            allParamRecords.some((record) =>
                nonSensicalSearchRecords.includes(record)
            )
        ) {
            ctx.utils.sendChatMessage(
                t("error.searchWords.nonsensicalRecordSearch", {
                    records: allParamRecords
                        .map((record) =>
                            t(`lib.recordType.${record}.recordName`, {
                                lng: l(ctx),
                            })
                        )
                        .join(", "),
                    lng: l(ctx),
                })
            );
            return;
        }

        if (allParamRecords.includes("previous_syllable")) {
            ctx.utils.sendChatMessage(
                t("command.searchWords.previousSyllableHint", {
                    recordType: t(
                        "lib.recordType.previous_syllable.recordName",
                        {
                            lng: l(ctx),
                        }
                    ),
                    lng: l(ctx),
                })
            );
            return;
        }
        if (allParamRecords.includes("alpha")) {
            ctx.utils.sendChatMessage(
                t("command.searchWords.alphaHint", {
                    recordType: t("lib.recordType.alpha.recordName", {
                        lng: l(ctx),
                    }),
                    lng: l(ctx),
                })
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
                t("error.searchWords.multipleSortRecords", {
                    sortRecords: sortWordsModeRecords
                        .map((record) =>
                            t(`lib.recordType.${record}.recordName`, {
                                lng: l(ctx),
                            })
                        )
                        .join(", "),
                    filterRecords: filterWordsModeRecords
                        .map((record) =>
                            t(`lib.recordType.${record}.recordName`, {
                                lng: l(ctx),
                            })
                        )
                        .join(", "),
                    lng: l(ctx),
                })
            );
            return;
        }

        let targetLanguage: BirdBotLanguage | null = null;
        if (paramLanguage) {
            targetLanguage = paramLanguage;
        } else {
            const roomDictionaryId =
                ctx.room.roomState.gameData!.rules.dictionaryId;
            if (
                !birdbotSupportedDictionaryIds.includes(roomDictionaryId as any)
            ) {
                ctx.utils.sendChatMessage(
                    t("error.notSupported.language", {
                        language: roomDictionaryId,
                        lng: l(ctx),
                    })
                );
                return;
            }
            const roomBirdBotLanguage =
                dictionaryIdToBirdbotLanguage[
                    roomDictionaryId as BirdBotSupportedDictionaryId
                ];
            targetLanguage = roomBirdBotLanguage;
        }

        let dictionaryResource;
        try {
            dictionaryResource = ctx.bot.getResource<DictionaryResource>(
                `dictionary-${targetLanguage}`
            );
        } catch (e) {
            ctx.utils.sendChatMessage(
                t("error.404.dictionaryResource", { lng: l(ctx) })
            );
            return;
        }
        let searchList: string[];
        let targetMsSyllable: string | null = null;
        if (requestedSortRecords.includes("flips")) {
            searchList = dictionaryResource.metadata.topFlipWords.map(
                (obj) => obj[0]
            );
        } else if (requestedSortRecords.includes("depleted_syllables")) {
            searchList = dictionaryResource.metadata.topSnWords.map(
                (obj) => obj[0]
            );
        } else if (requestedSortRecords.includes("multi_syllable")) {
            if (ctx.args.length > 1) {
                ctx.utils.sendChatMessage(
                    t("error.searchWords.mustProvideOneSyllable", {
                        lng: l(ctx),
                    })
                );
                return;
            }
            const syllable = ctx.args[0];
            const syllCount =
                dictionaryResource.metadata.syllablesCount[syllable];
            if (syllCount === undefined) {
                ctx.utils.sendChatMessage(t("error.404.syllableNotExists"));
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
                ctx.utils.sendChatMessage(
                    t("error.invalid.regex", { regex: arg, lng: l(ctx) })
                );
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
            return (
                regexes.every((regex) => regex.test(word)) &&
                filterFns.every((filterFn) => filterFn(word))
            );
        }

        const RESULT_LIMIT = 500;
        const TOTAL_CHARACTER_LIMIT = 120;
        const shouldSearchAllValidWords = targetMsSyllable !== null;

        let hiddenWordsCount = 0;
        let foundWords: string[] = [];

        function shouldStopSearchingWords() {
            return (
                !shouldSearchAllValidWords &&
                hiddenWordsCount + foundWords.length > RESULT_LIMIT
            );
        }

        function searchForWordsInDictionary(
            startIndex: number,
            endIndex: number
        ) {
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
            const randomStartIndex = Math.floor(
                Math.random() * searchList.length
            );
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
                .map((word) => ({
                    word,
                    score: word.split(targetMsSyllable).length - 1,
                }))
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
                      .map((record) => t(`lib.recordType.${record}.recordName`))
                      .concat(
                          requestedSortRecords.map((record) =>
                              t(`lib.recordType.${record}.recordName`)
                          )
                      )
                      .join(", ")}: `
                : "";

        if (cutResults.length > 0) {
            ctx.utils.sendChatMessage(
                t("command.searchWords.result", {
                    recordTypes: targetRecordsString,
                    resultCount: foundMoreThanLimit
                        ? `+${RESULT_LIMIT}`
                        : totalResultsCount,
                    hiddenCount: moreHiddenThanLimit
                        ? `+${RESULT_LIMIT}`
                        : hiddenWordsCount,
                    wordsList: cutResults.join(" ").toUpperCase(),
                    lng: l(ctx),
                })
            );
        } else {
            ctx.utils.sendChatMessage(
                t("command.searchWords.noResults", {
                    recordTypes: targetRecordsString,
                    resultCount: foundMoreThanLimit
                        ? `+${RESULT_LIMIT}`
                        : totalResultsCount,
                    hiddenCount: moreHiddenThanLimit
                        ? `+${RESULT_LIMIT}`
                        : hiddenWordsCount,
                    lng: l(ctx),
                })
            );
        }
    },
}) satisfies Command;

const playerProfileCommand = c({
    id: "playerProfile",
    aliases: ["profile", "p"],
    usageDesc: "/p [username] (-language -mode)",
    exampleUsage: "/p dfuzer - /p dfuzer -fr - /p dfuzer -fr -regular",
    handler: async (ctx) => {
        const targetUsername = ctx.args.join(" ");
        const targetLanguage = BirdBotUtils.findValueInAliasesObject(
            ctx.params,
            languageAliases
        );
        const targetMode = BirdBotUtils.findTargetItemInZodEnum(
            ctx.params,
            modesEnumSchema
        );

        type ResultType = {
            playerId: string;
            playerAccountName: string;
            playerUsername: string;
            foundUsername: string;
            xp: number;
            language: BirdBotLanguage;
            mode: BirdBotGameMode;
            pp: number;
            ppRank: number;
            gamesPlayedCount: number;
            recordsCount: number;
            records: {
                record_type: BirdBotRecordType;
                score: number;
                rank: number;
            }[];
            bestPerformances: {
                record_type: BirdBotRecordType;
                score: number;
                pp: number;
                weighted_pp: number;
                mode: BirdBotGameMode;
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
                    ctx.utils.sendChatMessage(t("error.404.player"));
                } else {
                    ctx.utils.sendChatMessage(t("error.api.inaccessible"));
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
            ctx.utils.sendChatMessage(t("error.api.inaccessible"));
            return;
        }

        if (!ctx.room.isHealthy()) {
            Logger.warn({
                message:
                    "Room is not healthy anymore, skipping the rest of command execution",
                path: "BirdBotCommands.ts",
            });
            return;
        }

        const messageParams = {
            languageFlag: t(`lib.language.${playerData.language}.flag`),
            gameMode: t(`lib.mode.${playerData.mode}`),
            playerUsername: playerData.playerUsername,
            lng: l(ctx),
        };

        if (playerData.records.length === 0) {
            ctx.utils.sendChatMessage(
                t("command.playerProfile.noRecords", messageParams)
            );
            return;
        }

        const records = playerData.records
            .sort(
                (a, b) =>
                    recordsUtils[a.record_type].order -
                    recordsUtils[b.record_type].order
            )
            .map((record) => {
                const r = recordsUtils[record.record_type];
                return `${t(
                    `lib.recordType.${record.record_type}.recordName`
                )}: ${r.format(record.score)}`;
            })
            .join(" — ");

        ctx.utils.sendChatMessage(
            t("command.playerProfile.result", {
                ...messageParams,
                records,
            })
        );
    },
}) satisfies Command;

const testCommand = c({
    id: "test",
    aliases: ["test"],
    adminRequired: true,
    usageDesc: "/test",
    hidden: true,
    handler: (ctx) => {
        const rooms = Object.values(ctx.bot.rawBot.rooms).forEach((room) =>
            room.ws?.close()
        );
    },
}) satisfies Command;

const rareSyllablesCommand = c({
    id: "rareSyllables",
    aliases: ["raresyllables", "raresyll", "rares", "rs"],
    usageDesc: "/rareSyllables [word]",
    handler: (ctx) => {
        const paramLanguage = BirdBotUtils.findValueInAliasesObject(
            ctx.params,
            languageAliases
        );
        const targetWord = ctx.args[0];

        if (!targetWord?.length) {
            ctx.utils.sendChatMessage(t("error.invalidParams.mustProvideWord"));
            return;
        }

        let targetLanguage: BirdBotLanguage | null = null;
        if (paramLanguage) {
            targetLanguage = paramLanguage;
        } else {
            const roomDictionaryId =
                ctx.room.roomState.gameData!.rules.dictionaryId;
            targetLanguage =
                dictionaryIdToBirdbotLanguage[
                    roomDictionaryId as BirdBotSupportedDictionaryId
                ];
        }

        const dictionaryResource = ctx.bot.getResource<DictionaryResource>(
            `dictionary-${targetLanguage}`
        );
        const dictionaryWords = dictionaryResource.resource;

        if (!dictionaryWords.includes(targetWord)) {
            ctx.utils.sendChatMessage(t("error.404.word"));
            return;
        }

        const wordSyllables = BirdBotUtils.splitWordIntoSyllables(targetWord);
        const rareSyllables: { syllable: string; count: number }[] = [];

        const dictionarySyllables = dictionaryResource.metadata.syllablesCount;

        for (const syllable in wordSyllables) {
            const syllableCountInWord = dictionarySyllables[syllable];

            if (!syllableCountInWord) {
                ctx.utils.sendChatMessage(
                    t("command.rareSyllables.errorSyllableNotInDictionary", {
                        syllable,
                        lng: l(ctx),
                    })
                );
                return;
            }

            if (syllableCountInWord < 9) {
                rareSyllables.push({ syllable, count: syllableCountInWord });
            }
        }

        if (rareSyllables.length) {
            ctx.utils.sendChatMessage(
                t("command.rareSyllables.result", {
                    languageFlag: t(`lib.language.${targetLanguage}.flag`),
                    word: targetWord,
                    rareSyllables: rareSyllables
                        .map((s) => `${s.syllable}: ${s.count}`)
                        .join(", "),
                    lng: l(ctx),
                })
            );
        } else {
            ctx.utils.sendChatMessage(
                t("command.rareSyllables.noneFound", {
                    languageFlag: t(`lib.language.${targetLanguage}.flag`),
                    word: targetWord,
                    lng: l(ctx),
                })
            );
        }
    },
}) satisfies Command;

const broadcastCommand = c({
    id: "broadcast",
    aliases: ["broadcast", "bc"],
    usageDesc: "/broadcast [message]",
    adminRequired: true,
    hidden: true,
    handler: (ctx) => {
        const message = ctx.args.join(" ");
        for (const roomId in ctx.bot.rooms) {
            const room = ctx.bot.rooms[roomId];
            if (room.ws && room.ws.readyState === WebSocket.OPEN) {
                room.ws.send(
                    ctx.bot.networkAdapter.getSendChatMessage(
                        t("command.broadcast.message", { message, lng: l(ctx) })
                    )
                );
            }
        }
    },
}) satisfies Command;

const discordCommand = c({
    id: "discord",
    aliases: ["discord"],
    usageDesc: "/discord",
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            t("command.discord.result", {
                link: DISCORD_SERVER_LINK,
                lng: l(ctx),
            })
        );
    },
}) satisfies Command;

const githubCommand = c({
    id: "github",
    aliases: ["github"],
    usageDesc: "/github",
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            t("command.github.result", { link: GITHUB_REPO_LINK, lng: l(ctx) })
        );
    },
}) satisfies Command;

const donateCommand = c({
    id: "donate",
    aliases: ["donate"],
    usageDesc: "/donate",
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            t("command.donate.result", {
                link: PAYPAL_DONATE_LINK,
                lng: l(ctx),
            })
        );
    },
}) satisfies Command;

const websiteCommand = c({
    id: "website",
    aliases: ["website"],
    usageDesc: "/website",
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            t("command.website.result", { link: WEBSITE_LINK, lng: l(ctx) })
        );
    },
}) satisfies Command;

const uptimeCommand = c({
    id: "uptime",
    aliases: ["uptime"],
    usageDesc: "/uptime",
    handler: (ctx) => {
        const uptimeMs = process.uptime() * 1000;
        const uptimeString = Utilitary.formatTime(uptimeMs);
        ctx.utils.sendChatMessage(
            t("command.uptime.result", { uptime: uptimeString, lng: l(ctx) })
        );
    },
}) satisfies Command;

const modUserCommand = c({
    id: "modUser",
    aliases: ["mod"],
    roomCreatorRequired: true,
    usageDesc: "/mod [username]",
    exampleUsage: "/mod dfuzer",
    handler: (ctx) => {
        const username = ctx.normalizedTextAfterCommand;
        if (!username) {
            ctx.utils.sendChatMessage(t("error.invalidParams.noUsername"));
            return;
        }

        const gamer = BirdBotUtils.findBestUsernameMatch(
            username,
            ctx.room.roomState.roomData!.gamers
        );
        if (!gamer) {
            ctx.utils.sendChatMessage(t("error.404.player"));
            return;
        }

        const gamerId = gamer.id;
        const role = "moderator" as RoomRole;

        const message = ctx.bot.networkAdapter.getSetGamerRoleMessage({
            gamerId,
            role,
        });

        ctx.utils.sendChatMessage(
            t("command.modUser.modding", {
                username: gamer.identity.nickname,
                lng: l(ctx),
            })
        );

        ctx.room.ws.send(message);
    },
}) satisfies Command;

const unmodUserCommand = c({
    id: "unmodUser",
    aliases: ["unmod"],
    roomCreatorRequired: true,
    usageDesc: "/unmod [username]",
    handler: (ctx) => {
        const username = ctx.normalizedTextAfterCommand;
        if (!username) {
            ctx.utils.sendChatMessage(t("error.invalidParams.noUsername"));
            return;
        }

        const gamer = BirdBotUtils.findBestUsernameMatch(
            username,
            ctx.room.roomState.roomData!.gamers
        );
        if (!gamer) {
            ctx.utils.sendChatMessage(t("error.404.player"));
            return;
        }

        const gamerId = gamer.id;
        const role = "" as RoomRole;

        const message = ctx.bot.networkAdapter.getSetGamerRoleMessage({
            gamerId,
            role,
        });

        ctx.utils.sendChatMessage(
            t("command.unmodUser.unmodding", {
                username: gamer.identity.nickname,
                lng: l(ctx),
            })
        );

        ctx.room.ws.send(message);
    },
}) satisfies Command;

const privateRoomCommand = c({
    id: "privateRoom",
    aliases: ["private", "priv", "pv"],
    usageDesc: "/private",
    adminRequired: true,
    hidden: true,
    handler: (ctx) => {
        const message = ctx.bot.networkAdapter.getSetRoomAccessModeMessage({
            accessMode: "private",
        });
        ctx.utils.sendChatMessage(t("command.privateRoom.setting"));
        ctx.room.ws.send(message);
    },
}) satisfies Command;

const publicRoomCommand = c({
    id: "publicRoom",
    aliases: ["public", "pub", "pb"],
    usageDesc: "/public",
    adminRequired: true,
    hidden: true,
    handler: (ctx) => {
        const message = ctx.bot.networkAdapter.getSetRoomAccessModeMessage({
            accessMode: "public",
        });
        ctx.utils.sendChatMessage(t("command.publicRoom.setting"));
        ctx.room.ws.send(message);
    },
}) satisfies Command;

const destroyAllRoomsCommand = c({
    id: "destroyAllRooms",
    aliases: ["destroy", "destroyall", "destroyallrooms"],
    usageDesc: "/destroyallrooms",
    adminRequired: true,
    hidden: true,
    handler: (ctx) => {
        for (const roomId in ctx.bot.rooms) {
            const room = ctx.bot.rooms[roomId];

            if (room.ws && room.ws.readyState === WebSocket.OPEN) {
                room.ws.send(
                    ctx.bot.networkAdapter.getSendChatMessage(
                        t("command.destroyAllRooms.message")
                    )
                );
            }

            Utilitary.destroyRoom(ctx.bot.rawBot, room);
        }
    },
}) satisfies Command;

const showAllRoomsCommand = c({
    id: "showAllRooms",
    aliases: ["rooms", "roomlist", "listrooms", "listroom"],
    usageDesc: "/rooms",
    adminRequired: true,
    hidden: true,
    handler: (ctx) => {
        const roomsList = Object.values(ctx.bot.rooms)
            .map((room) => {
                return `${room.constantRoomData.roomCode}: ${
                    room.roomState.gameData?.step.value ?? "gameData unknown"
                }`;
            })
            .join(" - ");

        ctx.utils.sendChatMessage(
            t("command.showAllRooms.result", { roomsList, lng: l(ctx) })
        );
    },
}) satisfies Command;

const createRoomCommand = c({
    id: "createRoom",
    aliases: ["createroom", "b"],
    usageDesc: "/createroom",
    handler: (ctx) => {
        const gamer = ctx.gamer;
        const bot = ctx.bot.rawBot as BirdBot;
        if (!gamer.identity.name) {
            ctx.utils.sendChatMessage(t("error.platform.mustBeLoggedIn"));
            return;
        }
        {
            if (bot.creatingRoomQueue.includes(gamer.identity.name)) {
                ctx.utils.sendChatMessage(
                    t("command.createRoom.roomBeingCreated", {
                        lng: l(ctx),
                    })
                );
                return;
            }
            for (const roomId in bot.rooms) {
                const room = bot.rooms[roomId];
                if (
                    room.constantRoomData.roomCreatorUsername ===
                    gamer.identity.name
                ) {
                    ctx.utils.sendChatMessage(
                        t("command.createRoom.roomAlreadyExists", {
                            code: room.constantRoomData.roomCode,
                            lng: l(ctx),
                        })
                    );
                    return;
                }
            }
        }
        const allArguments = ctx.args.concat(ctx.params);
        const targetLanguage = BirdBotUtils.findValueInAliasesObject(
            allArguments,
            languageAliases
        );
        const targetMode = BirdBotUtils.findTargetItemInZodEnum(
            allArguments,
            modesEnumSchema
        );

        if (
            targetLanguage !== null &&
            !birdbotSupportedDictionaryIds.includes(
                birdbotLanguageToDictionaryId[targetLanguage] as any
            )
        ) {
            ctx.utils.sendChatMessage(
                t("error.notSupported.language", {
                    language: t(`lib.language.${targetLanguage}.name`, {
                        lng: l(ctx),
                    }),
                    lng: l(ctx),
                })
            );
            return;
        }

        bot.creatingRoomQueue.push(gamer.identity.name);

        setTimeout(() => {
            if (!bot || typeof bot.creatingRoomQueue !== "object") return;
            bot.creatingRoomQueue = bot.creatingRoomQueue.filter(
                (name) => name !== gamer.identity.name
            );
        }, 1000 * 10);

        bot.createRoom({
            targetConfig: {
                dictionaryId:
                    birdbotLanguageToDictionaryId[
                        targetLanguage ?? defaultLanguage
                    ],
                gameMode: "survival",
                birdbotGameMode: targetMode ?? defaultMode,
            },
            roomCreatorUsername: gamer.identity.name,
            callback: (roomCode) => {
                bot.creatingRoomQueue = bot.creatingRoomQueue.filter(
                    (name) => name !== gamer.identity.name
                );
                if (ctx.room.isHealthy()) {
                    ctx.room.ws.send(
                        ctx.bot.networkAdapter.getSendChatMessage(
                            t("command.createRoom.roomCreated", {
                                roomCode,
                                lng: l(ctx),
                            })
                        )
                    );
                }
            },
            errorCallback: () => {
                bot.creatingRoomQueue = bot.creatingRoomQueue.filter(
                    (name) => name !== gamer.identity.name
                );
                if (ctx.room.isHealthy()) {
                    ctx.room.ws.send(
                        ctx.bot.networkAdapter.getSendChatMessage(
                            t("command.createRoom.unknownError", {
                                lng: l(ctx),
                            })
                        )
                    );
                }
            },
        });
    },
}) satisfies Command;

export const birdbotCommands = [
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
] satisfies Command[];
