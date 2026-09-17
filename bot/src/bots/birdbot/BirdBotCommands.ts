import { writeFile } from "fs/promises";
import type { Command, CommandHandlerCtx } from "../../lib/class/CommandUtils.class";
import CommandUtils from "../../lib/class/CommandUtils.class";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { alphabet } from "../../lib/constants/gameConstants";
import type { CustomBonusAlphabet } from "../../lib/types/gameTypes";
import BirdBot from "./BirdBot.class";
import {
    birdbotLanguageToDictionaryId,
    birdbotModeRules,
    birdbotSupportedDictionaryIds,
    defaultLanguage,
    defaultMode,
    dictionaryIdToBirdbotLanguage,
    DISCORD_SERVER_LINK,
    GITHUB_REPO_LINK,
    languageAliases,
    ListedRecord,
    listedRecords,
    listedRecordsPerLanguage,
    SemiListedRecord,
    modesEnumSchema,
    PAYPAL_DONATE_LINK,
    recordAliases,
    recordsUtils,
    semiListedRecordsPerLanguage,
    sortWordsModeRecords,
    WEBSITE_LINK,
} from "./BirdBotConstants";
import BirdBotDefinitions from "./BirdBotDefinitions.class";
import { API_KEY, API_URL, IS_UNSTABLE_DEV_MODE } from "./BirdBotEnv";
import { createBirdBotCommandRegistry } from "./commands/BirdBotCommandRegistry";
import { birdBotAdminCommands } from "./commands/BirdBotAdminCommands";
import { birdBotParityCommands, birdBotVipCommands } from "./commands/BirdBotParityCommands";
import {
    BirdBotGameMode,
    BirdBotLanguage,
    BirdBotRecordType,
    BirdBotRoomMetadata,
    BirdBotSupportedDictionaryId,
    DictionaryResource,
    ExperienceData,
    ListedRecordListResource,
    PlayerGameScores,
    BirdBotPlaystyle,
    BirdBotTrainingCondition,
    BirdBotTrainingListState,
    BirdBotTrainingSort,
} from "./BirdBotTypes";
import BirdBotUtils, { type ApiResponseAllRecords, type ApiResponseBestScoresSpecificRecord } from "./BirdBotUtils.class";
import BirdBotGameplayStateService from "./services/BirdBotGameplayState.service";
import BirdBotModerationService from "./services/BirdBotModeration.service";
import BirdBotParityApiService from "./services/BirdBotParityApi.service";
import BirdBotRegexService from "./services/BirdBotRegex.service";
import BirdBotTrainingService from "./services/BirdBotTraining.service";
import { l, t } from "./texts/BirdBotTextUtils";

const c = CommandUtils.createCommandHelper;

function findTargetGameMode(argumentsList: string[]): BirdBotGameMode | null {
    const normalizedArguments = argumentsList.map((argument) => (argument === "hardcore" ? "blitz" : argument));
    return BirdBotUtils.findTargetItemInZodEnum(normalizedArguments, modesEnumSchema);
}

type PlayerProfileResult = {
    playerId: string;
    playerAccountName: string;
    playerUsername: string;
    foundUsername: string;
    xp: ExperienceData;
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

async function fetchPlayerProfile(
    ctx: CommandHandlerCtx,
    username: string,
    filters: { language?: BirdBotLanguage; mode?: BirdBotGameMode } = {},
): Promise<PlayerProfileResult | null> {
    const params = new URLSearchParams({ searchByName: username });
    if (filters.language) params.set("language", filters.language);
    if (filters.mode) params.set("mode", filters.mode);

    try {
        const request = await BirdBotUtils.getJsonFromApi(`/player-profile?${params.toString()}`);
        if (!request.ok) {
            ctx.utils.sendChatMessage(
                t(request.status === 404 ? "error.404.player" : "error.api.inaccessible", {
                    lng: l(ctx),
                }),
            );
            return null;
        }
        return (await request.json()) as PlayerProfileResult;
    } catch (error) {
        Logger.error({
            message: "Error fetching player data",
            path: "BirdBotCommands.ts",
            error,
        });
        ctx.utils.sendChatMessage(t("error.api.inaccessible", { lng: l(ctx) }));
        return null;
    }
}

const helpCommand = c({
    id: "help",
    aliases: ["help", "h", "?", "helo"], // helo may be a misinput of help
    usageDesc: "/help - /help [command]",
    exampleUsage: "/help - /help records",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        if (ctx.args.length === 0) {
            const vipCommandIds = new Set(birdBotVipCommands.map((command) => command.id));
            const visibleCommands = birdbotCommands.filter((command) => !command.adminRequired);
            const commandFirstAliases = [
                ...visibleCommands.filter((command) => !vipCommandIds.has(command.id)),
                ...visibleCommands.filter((command) => vipCommandIds.has(command.id)),
            ]
                .map((c) => `/${c.aliases[0]}`)
                .join(" - ");
            ctx.utils.sendChatMessage(
                t("command.help.list", {
                    commandList: commandFirstAliases,
                    lng: l(ctx),
                }),
            );
            return;
        }
        const requestedCommand = ctx.args[0]!;
        const command = birdbotCommands.find((c) => c.aliases.includes(requestedCommand));
        if (!command) {
            ctx.utils.sendChatMessage(
                t("eventHandler.chat.commandNotFound", {
                    command: requestedCommand,
                    lng: l(ctx),
                }),
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
            }),
        );
    },
}) satisfies Command;

const recordsCommand = c({
    id: "records",
    aliases: ["records", "r", "recs", "rec", "record"],
    usageDesc: "/records - /records [recordType]",
    exampleUsage: "/records - /records words",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        const allArguments = ctx.params.concat(ctx.args);
        const targetLanguage = BirdBotUtils.findValueInAliasesObject(allArguments, languageAliases);
        const targetMode = BirdBotUtils.findTargetItemInZodEnum(allArguments, modesEnumSchema);
        const targetRecordType = BirdBotUtils.findValueInAliasesObject(allArguments, recordAliases);
        const targetPage = BirdBotUtils.findNumberInArgs(allArguments);
        const currentRoomLanguage =
            dictionaryIdToBirdbotLanguage[ctx.room.roomState.gameData!.rules.dictionaryId as BirdBotSupportedDictionaryId];
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        const language = targetLanguage ?? currentRoomLanguage ?? defaultLanguage;
        const mode = targetMode ?? (roomMetadata.gameMode === "custom" ? defaultMode : roomMetadata.gameMode);

        let responseData: ApiResponseBestScoresSpecificRecord | ApiResponseAllRecords | null = null;

        if (targetRecordType) {
            if (
                listedRecords.includes(targetRecordType as any) &&
                !listedRecordsPerLanguage[language].includes(targetRecordType as any)
            ) {
                ctx.utils.sendChatMessage(
                    t("error.notSupported.listedRecordNotExistsInLanguage", {
                        lng: l(ctx),
                    }),
                );
                return;
            }
        }

        try {
            const recordsRequest = await BirdBotUtils.getRecordsFromApi({
                language,
                gameMode: mode,
                recordType: targetRecordType ?? undefined,
                page: targetPage ?? undefined,
            });

            if (!recordsRequest.ok) {
                if (recordsRequest.status === 500)
                    ctx.utils.sendChatMessage(
                        t("error.api.inaccessible", {
                            lng: l(ctx),
                        }),
                    );
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
            ctx.utils.sendChatMessage(
                t("error.api.inaccessible", {
                    lng: l(ctx),
                }),
            );
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
            const records = r.bestScores
                .map(
                    (score) =>
                        `${score.rank}) ${t("general.scorePresentation", {
                            username: score.player_username,
                            score: t(`lib.recordType.${targetRecordType}.score`, {
                                context: "specific",
                                count: score.score,
                                formattedScore: recordsUtils[targetRecordType].format(score.score),
                                lng: l(ctx),
                            }),
                            lng: l(ctx),
                        })}`,
                )
                .join(" — ");

            ctx.utils.sendChatMessage(
                t("command.records.specificRecord", {
                    languageFlag: t(`lib.language.${language}.flag`, { lng: l(ctx) }),
                    gameMode: t(`lib.mode.${mode}`, { lng: l(ctx) }),
                    recordType: t(`lib.recordType.${targetRecordType}.recordName`, { lng: l(ctx) }),
                    records,
                    lng: l(ctx),
                }),
            );
        } else {
            const r = responseData as ApiResponseAllRecords;
            const records = r.bestScores
                .filter(
                    (score) =>
                        !(
                            listedRecords.includes(score.recordType as any) &&
                            !listedRecordsPerLanguage[language].includes(score.recordType as any)
                        ),
                )
                .sort((a, b) => recordsUtils[a.recordType].order - recordsUtils[b.recordType].order)
                .map((score) => {
                    return `${t(`lib.recordType.${score.recordType}.recordName`, { lng: l(ctx) })}: ${t(
                        "general.scorePresentation",
                        {
                            username: score.name,
                            score: t(`lib.recordType.${score.recordType}.score`, {
                                count: score.score,
                                formattedScore: recordsUtils[score.recordType].format(score.score),
                                lng: l(ctx),
                            }),
                            lng: l(ctx),
                        },
                    )}`;
                })
                .join(" — ");

            ctx.utils.sendChatMessage(
                t("command.records.allRecords", {
                    languageFlag: t(`lib.language.${language}.flag`, { lng: l(ctx) }),
                    gameMode: t(`lib.mode.${mode}`, { lng: l(ctx) }),
                    records,
                    lng: l(ctx),
                }),
            );
        }
    },
}) satisfies Command;

const currentGameScoresCommand = c({
    id: "currentGameScore",
    aliases: ["score", "stats", "sc", "j", "joueur"],
    usageDesc: "/score (player)",
    exampleUsage: "/score - /score dfuzer",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        const targetPlayerName = ctx.normalizedMessage.slice(ctx.usedAlias.length + 2);
        if (ctx.room.roomState.gameData!.milestone.name !== "round") {
            ctx.utils.sendChatMessage(
                t("error.roomState.noGameInProgress", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        function sendResults(username: string, playerStats: PlayerGameScores) {
            const scores = BirdBotUtils.getFormattedPlayerScores(playerStats, l(ctx));
            if (scores.length > 0) {
                ctx.utils.sendChatMessage(
                    t("command.currentGameScore.result", {
                        username,
                        scores,
                        lng: l(ctx),
                    }),
                );
            } else {
                ctx.utils.sendChatMessage(
                    t("command.currentGameScore.noScores", {
                        username,
                        lng: l(ctx),
                    }),
                );
            }
        }

        if (targetPlayerName.length) {
            const bestMatch = BirdBotUtils.findBestUsernameMatch(targetPlayerName, ctx.room.roomState.roomData!.chatters);
            if (bestMatch) {
                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                const playerStats = roomMetadata.scoresByPeerId[bestMatch.peerId];

                if (playerStats === undefined) {
                    ctx.utils.sendChatMessage(
                        t("error.404.playerStats", {
                            lng: l(ctx),
                        }),
                    );
                    return;
                }
                sendResults(bestMatch.nickname, playerStats);
            } else {
                ctx.utils.sendChatMessage(
                    t("error.404.player", {
                        lng: l(ctx),
                    }),
                );
            }
        } else {
            const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;

            if (roomMetadata.scoresByPeerId[ctx.gamer.peerId] !== undefined) {
                const playerStats = roomMetadata.scoresByPeerId[ctx.gamer.peerId];
                sendResults(ctx.gamer.nickname, playerStats);
                return;
            } else {
                const currentPlayer = Utilitary.getCurrentPlayer(ctx.room.roomState.gameData!);
                if (!currentPlayer) {
                    ctx.utils.sendChatMessage(
                        t("error.404.currentPlayer", {
                            lng: l(ctx),
                        }),
                    );
                    return;
                }
                const playerStats = roomMetadata.scoresByPeerId[currentPlayer.peerId];
                if (playerStats === undefined) {
                    ctx.utils.sendChatMessage(
                        t("error.404.playerStats", {
                            lng: l(ctx),
                        }),
                    );
                    return;
                }
                const gamer = ctx.room.roomState.roomData!.chatters.find((gamer) => gamer.peerId === currentPlayer.peerId);
                if (gamer === undefined) {
                    ctx.utils.sendChatMessage(
                        t("error.404.gamer", {
                            lng: l(ctx),
                        }),
                    );
                    return;
                }
                sendResults(gamer.nickname, playerStats);
            }
        }
    },
}) satisfies Command;

const startGameCommand = c({
    id: "startGame",
    aliases: ["start", "startgame", "startnow", "sn"],
    usageDesc: "/sn",
    roomCreatorRequired: true,
    accessibleInRound: false,
    exampleUsage: "/sn",
    handler: (ctx) => {
        if (ctx.room.roomState.gameData!.milestone.name !== "seating") {
            ctx.utils.sendChatMessage(
                t("error.roomState.notInPregame", {
                    lng: l(ctx),
                }),
            );
            return;
        }
        if (ctx.room.roomState.gameData!.players.length < 2) {
            ctx.utils.sendChatMessage(
                t("error.roomState.notEnoughPlayers", {
                    lng: l(ctx),
                }),
            );
            return;
        }
        ctx.utils.startRoundNow();
        ctx.utils.sendChatMessage(
            t("command.startGame.starting", {
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const setGameModeCommand = c({
    id: "setGameMode",
    aliases: ["mode", "m"],
    usageDesc:
        "/mode [regular|easy|blitz|sub500|sub50|freeplay] — /mode custom [difficulty] [turn] [age] [starting lives] [max lives]",
    exampleUsage: "/mode easy — /mode custom -50 5 16 2 3",
    roomCreatorRequired: true,
    accessibleInRound: false,
    handler: (ctx) => {
        if (ctx.room.roomState.gameData!.milestone.name !== "seating") {
            ctx.utils.sendChatMessage(
                t("error.roomState.cannotSetMode", {
                    lng: l(ctx),
                }),
            );
            return;
        }
        const rawTokens = ctx.normalizedTextAfterCommand.toLowerCase().split(/\s+/).filter(Boolean);
        if (rawTokens[0] === "custom") {
            const values = rawTokens.slice(1).map(Number);
            const bounds = [
                [-1000, 1000],
                [1, 10],
                [1, 16],
                [1, 5],
                [1, 10],
            ] as const;
            if (
                values.length !== 5 ||
                values.some((value, index) => !Number.isFinite(value) || value < bounds[index]![0] || value > bounds[index]![1])
            ) {
                ctx.utils.sendChatMessage(
                    "Usage: /mode custom [difficulty -1000..1000] [turn 1..10] [age 1..16] [starting lives 1..5] [max lives 1..10].",
                );
                return;
            }
            const [difficulty, minTurnDuration, maxPromptAge, startingLives, maxLives] = values as [
                number,
                number,
                number,
                number,
                number,
            ];
            BirdBotUtils.setRoomGameMode(ctx, {
                promptDifficulty: "custom",
                customPromptDifficulty: difficulty,
                minTurnDuration,
                maxPromptAge,
                startingLives,
                maxLives,
            });
            BirdBotGameplayStateService.metadata(ctx).gameMode = "custom";
            ctx.utils.sendChatMessage(t("parity.gameplay.customMode", { lng: l(ctx) }), "info");
            return;
        }

        const targetGameMode = findTargetGameMode(rawTokens);
        if (targetGameMode) {
            const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
            if (roomMetadata.gameMode === targetGameMode) {
                ctx.utils.sendChatMessage(
                    t("command.setGameMode.alreadySet", {
                        gameMode: t(`lib.mode.${targetGameMode}`, {
                            lng: l(ctx),
                        }),
                        lng: l(ctx),
                    }),
                );
                return;
            }
            ctx.utils.sendChatMessage(
                t("command.setGameMode.setting", {
                    gameMode: t(`lib.mode.${targetGameMode}`, { lng: l(ctx) }),
                    lng: l(ctx),
                }),
            );
            const targetGameModeRules = birdbotModeRules[targetGameMode];

            BirdBotUtils.setRoomGameMode(ctx, targetGameModeRules);
        } else {
            ctx.utils.sendChatMessage(t("error.invalid.gameMode", { lng: l(ctx) }));
        }
    },
}) satisfies Command;

const setPlaystyleCommand = c({
    id: "setPlaystyle",
    aliases: ["playstyle", "style", "ps"],
    usageDesc: "/playstyle [regular|alpha|previous|life|sn|ms|record]",
    exampleUsage: "/ps alpha",
    roomCreatorRequired: true,
    accessibleInRound: true,
    handler: (ctx) => {
        const requested = ctx.args[0];
        if (!requested) {
            ctx.utils.sendChatMessage(t("parity.gameplay.providePlaystyle", { lng: l(ctx) }), "error");
            return;
        }
        const language = BirdBotUtils.getCurrentRoomLanguage(ctx);
        const direct: Record<string, BirdBotPlaystyle> = {
            regular: "regular",
            alpha: "alpha",
            ps: "previous_syllable",
            previous: "previous_syllable",
            "previous-syllable": "previous_syllable",
            life: "flips",
            flip: "flips",
            flips: "flips",
            sn: "depleted_syllables",
            depleted: "depleted_syllables",
            ms: "multi_syllable",
            multi: "multi_syllable",
        };
        let playstyle = direct[requested] ?? null;
        const record = BirdBotUtils.findValueInAliasesObject([requested], recordAliases);
        if (
            !playstyle &&
            record &&
            (record === "hyphen" ||
                record === "more_than_20_letters" ||
                listedRecordsPerLanguage[language].includes(record as any))
        ) {
            playstyle = record as BirdBotPlaystyle;
        }
        if (!playstyle) {
            ctx.utils.sendChatMessage(t("parity.gameplay.unavailablePlaystyle", { lng: l(ctx) }), "error");
            return;
        }
        BirdBotGameplayStateService.metadata(ctx).playstyle = playstyle;
        ctx.utils.sendChatMessage(t("parity.gameplay.playstyleEnabled", { playstyle, lng: l(ctx) }), "success");
    },
}) satisfies Command;

const TRAIN_MATCH_LIMIT = 30_000;

const trainCommand = c({
    id: "train",
    aliases: ["train"],
    usageDesc: "/train [regexes] (-record -l -s -sn) — /train [record]",
    exampleUsage: "/train ^pre -l — /train food",
    roomCreatorRequired: true,
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        const language = BirdBotUtils.getCurrentRoomLanguage(ctx);
        const listed: readonly ListedRecord[] = listedRecordsPerLanguage[language];
        const semiListed: readonly SemiListedRecord[] = semiListedRecordsPerLanguage[language];

        const applyList = (
            list: Omit<BirdBotTrainingListState, "successes" | "attempts">,
            count: number,
            sortName: string,
            listName: string,
            scoresFirst: boolean,
        ) => {
            BirdBotTrainingService.set(ctx, {
                creatorAuthId: ctx.gamer.authId!,
                list: { ...list, successes: 0, attempts: 0 },
            });
            const announceConfigured = () =>
                ctx.utils.sendChatMessage(
                    t("parity.gameplay.trainingConfigured", {
                        count,
                        sort: sortName.toUpperCase(),
                        list: listName.toUpperCase(),
                        lng: l(ctx),
                    }),
                    "success",
                );
            if (scoresFirst) BirdBotGameplayStateService.announceScoreCounting(ctx);
            announceConfigured();
            if (!scoresFirst) BirdBotGameplayStateService.announceScoreCounting(ctx);
        };

        for (const arg of ctx.args) {
            const record = BirdBotUtils.findValueInAliasesObject([arg], recordAliases);
            if (record && listed.includes(record as ListedRecord)) {
                const listedRecord = record as ListedRecord;
                applyList(
                    { source: listedRecord, sort: "shuffle", conditions: [], regexSources: [] },
                    BirdBotTrainingService.sourceSize(ctx, listedRecord),
                    "shuffle",
                    `${listedRecord}-list`,
                    false,
                );
                return;
            }
            if (record && semiListed.includes(record as SemiListedRecord)) {
                const list = {
                    source: "dictionary" as const,
                    sort: "shuffle" as const,
                    conditions: [{ type: record as SemiListedRecord }],
                    regexSources: [],
                };
                applyList(list, BirdBotTrainingService.countMatches(ctx, list), "shuffle", `${record}-list`, false);
                return;
            }
            if (record === "depleted_syllables") {
                applyList(
                    { source: "low_sub_words", sort: "sn", conditions: [], regexSources: [] },
                    BirdBotTrainingService.sourceSize(ctx, "low_sub_words"),
                    "sn",
                    "low-sub-words",
                    false,
                );
                return;
            }
            if (record === "alpha") {
                applyList(
                    { source: "dictionary", sort: "shuffle", conditions: [{ type: "alpha" }], regexSources: [] },
                    BirdBotTrainingService.sourceSize(ctx, "dictionary"),
                    "shuffle",
                    "dictionary",
                    false,
                );
                return;
            }
            if (record === "previous_syllable") {
                applyList(
                    {
                        source: "dictionary",
                        sort: "shuffle",
                        conditions: [{ type: "previous_syllable" }],
                        regexSources: [],
                    },
                    BirdBotTrainingService.sourceSize(ctx, "dictionary"),
                    "shuffle",
                    "dictionary",
                    false,
                );
                return;
            }
            if (record === "multi_syllable") {
                applyList(
                    { source: "dictionary", sort: "ms", conditions: [{ type: "multi_syllable" }], regexSources: [] },
                    BirdBotTrainingService.sourceSize(ctx, "dictionary"),
                    "ms",
                    "dictionary",
                    false,
                );
                return;
            }
            if (record === "flips") {
                ctx.utils.sendChatMessage(t("parity.gameplay.notImplemented", { lng: l(ctx) }), "error");
                return;
            }
        }

        let source: BirdBotTrainingListState["source"] = "dictionary";
        let listName = `${language}-dictionary`;
        let sort: BirdBotTrainingSort = "shuffle";
        const conditions: BirdBotTrainingCondition[] = [];

        for (const param of ctx.params) {
            const record = BirdBotUtils.findValueInAliasesObject([param], recordAliases);
            if (record && listed.includes(record as ListedRecord)) {
                source = record as ListedRecord;
                listName = `${record}-list`;
            }
        }

        for (const param of ctx.params) {
            const record = BirdBotUtils.findValueInAliasesObject([param], recordAliases);
            if (record === "hyphen" && semiListed.includes("hyphen")) conditions.push({ type: "hyphen" });
            if (record === "more_than_20_letters" && semiListed.includes("more_than_20_letters")) {
                conditions.push({ type: "more_than_20_letters" });
            }
            if (param === "l") sort = "l";
            if (param === "s") sort = "s";
            if (record === "depleted_syllables") {
                sort = "sn";
                source = "low_sub_words";
            }
        }

        if (ctx.args.length > 0) {
            const compiled = BirdBotRegexService.compileDetailed(ctx.args, true);
            if (!compiled.ok) {
                ctx.utils.sendChatMessage(
                    compiled.reason === "expensive"
                        ? t("parity.gameplay.regexTooExpensive", { lng: l(ctx) })
                        : t("error.invalid.regex", { regex: compiled.source, lng: l(ctx) }),
                    "error",
                );
                return;
            }
            const list = { source, sort, conditions, regexSources: ctx.args };
            const count = BirdBotTrainingService.countMatches(ctx, list);
            if (count > TRAIN_MATCH_LIMIT) {
                ctx.utils.sendChatMessage(
                    t("parity.gameplay.tooManyTrainingMatches", { max: TRAIN_MATCH_LIMIT, lng: l(ctx) }),
                    "error",
                );
                return;
            }
            if (count < 1) {
                ctx.utils.sendChatMessage(t("parity.gameplay.noTrainingMatches", { lng: l(ctx) }), "error");
                return;
            }
            applyList(list, count, sort, listName, true);
            return;
        }

        const metadata = BirdBotGameplayStateService.metadata(ctx);
        if (metadata.training !== null) {
            BirdBotTrainingService.set(ctx, null);
            ctx.utils.sendChatMessage(t("parity.gameplay.trainingDisabled", { lng: l(ctx) }), "success");
            BirdBotGameplayStateService.announceScoreCounting(ctx);
            return;
        }
        BirdBotTrainingService.set(ctx, { creatorAuthId: ctx.gamer.authId!, list: null });
        ctx.utils.sendChatMessage(t("parity.gameplay.trainingEnabled", { lng: l(ctx) }), "success");
        BirdBotGameplayStateService.announceScoreCounting(ctx);
    },
}) satisfies Command;

const setRoomLanguageCommand = c({
    id: "setRoomLanguage",
    aliases: ["language", "lang", "l", "changelanguage", "changelang", "langue", "langage"],
    usageDesc: "/language [language]",
    exampleUsage: "/language fr",
    roomCreatorRequired: true,
    accessibleInRound: false,
    handler: (ctx) => {
        if (ctx.room.roomState.gameData!.milestone.name !== "seating") {
            ctx.utils.sendChatMessage(
                t("error.roomState.cannotSetLanguage", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        const targetLanguage = BirdBotUtils.findValueInAliasesObject(ctx.params.concat(ctx.args), languageAliases);

        if (targetLanguage) {
            const targetDictionaryId = birdbotLanguageToDictionaryId[targetLanguage];
            if (ctx.room.roomState.gameData!.rules.dictionaryId === targetDictionaryId) {
                ctx.utils.sendChatMessage(
                    t("command.setRoomLanguage.alreadySet", {
                        language: t(`lib.language.${targetLanguage}.name`, {
                            lng: l(ctx),
                        }),
                        lng: l(ctx),
                    }),
                );
                return;
            }
            ctx.utils.sendChatMessage(
                t("command.setRoomLanguage.setting", {
                    language: t(`lib.language.${targetLanguage}.name`, {
                        lng: l(ctx),
                    }),
                    lng: l(ctx),
                }),
            );
            BirdBotUtils.setRoomDictionary(ctx, targetDictionaryId);
            BirdBotGameplayStateService.resetForLanguageChange(ctx);
        } else {
            ctx.utils.sendChatMessage(
                t("error.invalid.language", {
                    lng: l(ctx),
                }),
            );
        }
    },
}) satisfies Command;

const searchWordsCommand = c({
    id: "searchWords",
    aliases: ["searchwords", "c", "words", "search"],
    usageDesc: "/c (-record) [...syllables|regexes]",
    exampleUsage: "/c hello - /c ^hello$ - /c -life syll - /c -sn syll",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        if (ctx.args.length === 0) {
            const milestone = ctx.room.roomState.gameData!.milestone;
            if (milestone.name !== "round") {
                ctx.utils.sendChatMessage(t("error.searchWords.noArguments", { lng: l(ctx) }));
                return;
            }
            ctx.args.push(milestone.syllable);
        }

        const paramLanguage = BirdBotUtils.findValueInAliasesObject(ctx.params, languageAliases);
        const allParamRecords = BirdBotUtils.findValuesInAliasesObject(ctx.params, recordAliases);

        const nonSensicalSearchRecords: BirdBotRecordType[] = ["no_death", "word", "time"];
        if (allParamRecords.some((record) => nonSensicalSearchRecords.includes(record))) {
            ctx.utils.sendChatMessage(
                t("error.searchWords.nonsensicalRecordSearch", {
                    records: allParamRecords
                        .map((record) =>
                            t(`lib.recordType.${record}.recordName`, {
                                lng: l(ctx),
                            }),
                        )
                        .join(", "),
                    lng: l(ctx),
                }),
            );
            return;
        }

        if (allParamRecords.includes("previous_syllable")) {
            ctx.utils.sendChatMessage(
                t("command.searchWords.previousSyllableHint", {
                    recordType: t("lib.recordType.previous_syllable.recordName", {
                        lng: l(ctx),
                    }),
                    lng: l(ctx),
                }),
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
                }),
            );
            return;
        }

        const requestedRecords = Utilitary.getUniqueStrings(allParamRecords);

        if (requestedRecords.length > 1) {
            ctx.utils.sendChatMessage(
                t("error.searchWords.multipleRecords", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        const requestedRecord = requestedRecords[0];

        let targetLanguage: BirdBotLanguage | null = null;
        if (paramLanguage) {
            targetLanguage = paramLanguage;
        } else {
            const roomDictionaryId = ctx.room.roomState.gameData!.rules.dictionaryId;
            if (!birdbotSupportedDictionaryIds.includes(roomDictionaryId as any)) {
                ctx.utils.sendChatMessage(
                    t("error.notSupported.language", {
                        language: roomDictionaryId,
                        lng: l(ctx),
                    }),
                );
                return;
            }
            const roomBirdBotLanguage = dictionaryIdToBirdbotLanguage[roomDictionaryId as BirdBotSupportedDictionaryId];
            targetLanguage = roomBirdBotLanguage;
        }

        let requestedListedRecord: ListedRecord | null = null;

        if (listedRecords.includes(requestedRecord as any)) {
            if (!listedRecordsPerLanguage[targetLanguage].includes(requestedRecord as any)) {
                ctx.utils.sendChatMessage(
                    t("error.notSupported.listedRecordNotExistsInLanguage", {
                        lng: l(ctx),
                    }),
                );
            } else {
                requestedListedRecord = requestedRecord as ListedRecord;
            }
        }

        let dictionaryResource;
        try {
            dictionaryResource = ctx.bot.getResource<DictionaryResource>(`dictionary-${targetLanguage}`);
        } catch (e) {
            ctx.utils.sendChatMessage(t("error.404.dictionaryResource", { lng: l(ctx) }));
            return;
        }
        let searchList: string[];
        let targetMsSyllable: string | null = null;
        if (requestedRecord === "flips") {
            searchList = dictionaryResource.metadata.topFlipWords.map((obj) => obj[0]);
        } else if (requestedRecord === "depleted_syllables") {
            searchList = dictionaryResource.metadata.topSnWords.map((obj) => obj[0]);
        } else if (requestedRecord === "multi_syllable") {
            if (ctx.args.length > 1) {
                ctx.utils.sendChatMessage(
                    t("error.searchWords.mustProvideOneSyllable", {
                        lng: l(ctx),
                    }),
                );
                return;
            }
            const syllable = ctx.args[0];
            const syllCount = dictionaryResource.metadata.syllablesCount[syllable];
            if (syllCount === undefined) {
                ctx.utils.sendChatMessage(
                    t("error.404.syllableNotExists", {
                        lng: l(ctx),
                    }),
                );
                return;
            }
            targetMsSyllable = syllable;
            searchList = dictionaryResource.resource;
        } else if (requestedListedRecord) {
            const resource = ctx.bot.getResource<ListedRecordListResource>(`list-${requestedRecord}-${targetLanguage}`);
            searchList = resource.resource;
        } else {
            searchList = dictionaryResource.resource;
        }

        const regexes = BirdBotRegexService.compile(ctx.args);
        if (regexes === null) {
            ctx.utils.sendChatMessage(t("parity.gameplay.invalidRegex", { lng: l(ctx) }), "error");
            return;
        }
        const safeRegexes = regexes;

        const activeRoomPrompts: string[] = [];
        const rooms = Object.values(ctx.bot.rooms);
        for (const room of rooms) {
            const roomMetadata = room.roomState.metadata as Partial<BirdBotRoomMetadata>;
            if (roomMetadata.training) continue;
            const roomSyllable =
                room.roomState.gameData?.milestone.name === "round" ? room.roomState.gameData.milestone.syllable : null;
            if (roomSyllable) {
                activeRoomPrompts.push(roomSyllable);
            }
        }
        let caseInsensitiveOnlyMatches = 0;
        const caseInsensitiveOnlySamples: { word: string; prompt: string }[] = [];
        function isWordHidden(word: string) {
            const exactMatch = activeRoomPrompts.some((prompt) => word.includes(prompt));
            if (!exactMatch) {
                const lowercaseWord = word.toLowerCase();
                const lowercasePrompt = activeRoomPrompts.find((prompt) => lowercaseWord.includes(prompt.toLowerCase()));
                if (lowercasePrompt) {
                    caseInsensitiveOnlyMatches++;
                    if (caseInsensitiveOnlySamples.length < 5) {
                        caseInsensitiveOnlySamples.push({ word, prompt: lowercasePrompt });
                    }
                }
            }
            return exactMatch;
        }

        const filterFns: ((word: string) => boolean)[] = [];
        if (requestedRecord === "hyphen") {
            filterFns.push((word) => word.includes("-"));
        }
        if (requestedRecord === "more_than_20_letters") {
            filterFns.push((word) => word.length >= 20);
        }
        if (targetMsSyllable) {
            filterFns.push((word) => word.includes(targetMsSyllable));
        }

        function isWordValid(word: string) {
            return safeRegexes.every((regex) => regex.test(word)) && filterFns.every((filterFn) => filterFn(word));
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

        const shouldStartFromRandomIndex = !sortWordsModeRecords.includes(requestedRecord as any);

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

        Logger.log({
            message: "/c hidden-word diagnostics",
            path: "BirdBotCommands.ts",
            json: {
                searchArgs: ctx.args,
                activeRoomPrompts,
                hiddenWordsCount,
                caseInsensitiveOnlyMatches,
                caseInsensitiveOnlySamples,
            },
        });

        const targetRecordsString = requestedRecord
            ? `${t(`lib.recordType.${requestedRecord}.recordName`, { lng: l(ctx) })}: `
            : "";

        if (cutResults.length > 0) {
            ctx.utils.sendChatMessage(
                t("command.searchWords.result", {
                    recordTypes: targetRecordsString,
                    resultCount: foundMoreThanLimit ? `+${RESULT_LIMIT}` : totalResultsCount,
                    hiddenCount: moreHiddenThanLimit ? `+${RESULT_LIMIT}` : hiddenWordsCount,
                    wordsList: cutResults.join(" ").toUpperCase(),
                    lng: l(ctx),
                }),
            );
        } else {
            ctx.utils.sendChatMessage(
                t("command.searchWords.noResults", {
                    recordTypes: targetRecordsString,
                    resultCount: foundMoreThanLimit ? `+${RESULT_LIMIT}` : totalResultsCount,
                    hiddenCount: moreHiddenThanLimit ? `+${RESULT_LIMIT}` : hiddenWordsCount,
                    lng: l(ctx),
                }),
            );
        }
    },
}) satisfies Command;

const playerProfileCommand = c({
    id: "playerProfile",
    aliases: ["profile", "p", "i"],
    usageDesc: "/p (username)",
    exampleUsage: "/p - /p dfuzer",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        const targetUsername = ctx.args.length > 0 ? ctx.args.join(" ") : ctx.gamer.authId;
        if (!targetUsername) {
            ctx.utils.sendChatMessage(
                t("command.playerProfile.noUsernameNotConnected", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        const playerData = await fetchPlayerProfile(ctx, targetUsername);
        if (!playerData) return;

        if (!ctx.room.isHealthy()) {
            Logger.warn({
                message: "Room is not healthy anymore, skipping the rest of command execution",
                path: "BirdBotCommands.ts",
            });
            return;
        }

        ctx.utils.sendChatMessage(
            t("command.playerProfile.result", {
                languageFlag: t(`lib.language.${playerData.language}.flag`),
                playerUsername: playerData.playerUsername,
                rank: playerData.ppRank,
                pp: playerData.pp,
                currentLevelXp: playerData.xp.currentLevelXp,
                totalLevelXp: playerData.xp.totalLevelXp,
                level: playerData.xp.level,
                profileLink: `${WEBSITE_LINK}/p/${encodeURIComponent(playerData.playerAccountName)}`,
                topPerformances: playerData.bestPerformances
                    .sort((a, b) => b.pp - a.pp)
                    .map((performance) => {
                        return (
                            (performance.mode !== "regular"
                                ? `[${t(`lib.mode.${performance.mode}`, {
                                      lng: l(ctx),
                                  })}] `
                                : "") +
                            t(`lib.recordType.${performance.record_type}.score`, {
                                context: "specific",
                                count: performance.score,
                                formattedScore: recordsUtils[performance.record_type].format(performance.score),
                                lng: l(ctx),
                            }) +
                            ` (+${performance.pp}pp)`
                        );
                    })
                    .slice(0, 5)
                    .join(" — "),
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const playerRecordsCommand = c({
    id: "playerRecords",
    aliases: ["playerrecords", "personalrecords", "pr"],
    usageDesc: "/pr (username) (-language -mode)",
    exampleUsage: "/pr - /pr dfuzer - /pr dfuzer -fr -regular",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        const targetUsername = ctx.args.length > 0 ? ctx.args.join(" ") : ctx.gamer.authId;
        if (!targetUsername) {
            ctx.utils.sendChatMessage(t("command.playerRecords.noUsernameNotConnected", { lng: l(ctx) }));
            return;
        }

        const currentRoomLanguage =
            dictionaryIdToBirdbotLanguage[ctx.room.roomState.gameData!.rules.dictionaryId as BirdBotSupportedDictionaryId];
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        const language =
            BirdBotUtils.findValueInAliasesObject(ctx.params, languageAliases) ?? currentRoomLanguage ?? defaultLanguage;
        const requestedMode = findTargetGameMode(ctx.params);
        const mode = requestedMode ?? (roomMetadata.gameMode === "custom" ? defaultMode : roomMetadata.gameMode);
        const playerData = await fetchPlayerProfile(ctx, targetUsername, { language, mode });
        if (!playerData) return;

        if (!ctx.room.isHealthy()) {
            Logger.warn({
                message: "Room is not healthy anymore, skipping the rest of command execution",
                path: "BirdBotCommands.ts",
            });
            return;
        }

        const messageParams = {
            languageFlag: t(`lib.language.${playerData.language}.flag`, { lng: l(ctx) }),
            gameMode: t(`lib.mode.${playerData.mode}`, { lng: l(ctx) }),
            playerUsername: playerData.playerUsername,
            profileLink: `${WEBSITE_LINK}/p/${encodeURIComponent(playerData.playerAccountName)}`,
            lng: l(ctx),
        };

        if (playerData.records.length === 0) {
            ctx.utils.sendChatMessage(t("command.playerRecords.noRecords", messageParams));
            return;
        }

        const records = playerData.records
            .sort((a, b) => recordsUtils[a.record_type].order - recordsUtils[b.record_type].order)
            .map((record) => {
                const recordUtils = recordsUtils[record.record_type];
                return `${t(`lib.recordType.${record.record_type}.recordName`, { lng: l(ctx) })}: ${recordUtils.format(
                    record.score,
                )}`;
            })
            .join(" — ");

        ctx.utils.sendChatMessage(
            t("command.playerRecords.result", {
                ...messageParams,
                records,
            }),
        );
    },
}) satisfies Command;

const xpCommand = c({
    id: "xp",
    aliases: ["xp", "x"],
    usageDesc: "/xp - /xp [username]",
    exampleUsage: "/xp - /xp dfuzer",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        const targetUsername = ctx.args.length > 0 ? ctx.args.join(" ") : ctx.gamer.authId;
        if (!targetUsername) {
            ctx.utils.sendChatMessage(
                t("command.xp.noUsernameNotConnected", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        type XpProfileResult = {
            playerUsername: string;
            playerAccountName: string;
            xp: ExperienceData;
        };

        let playerData: XpProfileResult | null = null;

        try {
            // Reuse the existing profile API — XP is computed server-side via getLevelDataFromXp
            const playerDataRequest = await BirdBotUtils.getJsonFromApi(
                `/player-profile?searchByName=${encodeURIComponent(targetUsername)}`,
            );
            if (!playerDataRequest.ok) {
                if (playerDataRequest.status === 404) {
                    ctx.utils.sendChatMessage(
                        t("error.404.player", {
                            lng: l(ctx),
                        }),
                    );
                } else {
                    ctx.utils.sendChatMessage(
                        t("error.api.inaccessible", {
                            lng: l(ctx),
                        }),
                    );
                }
                return;
            }
            playerData = (await playerDataRequest.json()) as XpProfileResult;
        } catch (e) {
            Logger.error({
                message: "Error fetching player XP",
                path: "BirdBotCommands.ts",
                error: e,
            });
            ctx.utils.sendChatMessage(
                t("error.api.inaccessible", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        if (!ctx.room.isHealthy()) {
            Logger.warn({
                message: "Room is not healthy anymore, skipping the rest of command execution",
                path: "BirdBotCommands.ts",
            });
            return;
        }

        ctx.utils.sendChatMessage(
            t("command.xp.result", {
                playerUsername: playerData.playerUsername,
                level: playerData.xp.level,
                currentLevelXp: playerData.xp.currentLevelXp,
                totalLevelXp: playerData.xp.totalLevelXp,
                totalXp: playerData.xp.xp,
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const showTimeCommand = c({
    id: "showTime",
    aliases: ["showtime", "time", "t"],
    usageDesc: "/showtime",
    exampleUsage: "/showtime",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        const gameData = ctx.room.roomState.gameData;
        if (!gameData || gameData.milestone.name !== "round") {
            ctx.utils.sendChatMessage(
                t("error.roomState.noGameInProgress", {
                    lng: l(ctx),
                }),
            );
            return;
        }
        const elapsed = Date.now() - ctx.room.roomState.roundStartTimestamp;
        ctx.utils.sendChatMessage(
            t("command.showTime.result", {
                time: recordsUtils.time.format(elapsed),
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const changeBonusAlphabetCommand = c({
    id: "changeBonusAlphabet",
    aliases: ["bonusalphabet", "bl", "changebl", "changebonusalphabet"],
    usageDesc: "/bonusalphabet default - /bonusalphabet reset - /bonusalphabet a:1 b:0 - /bonusalphabet reset x:1",
    exampleUsage: "/bonusalphabet default - /bonusalphabet a:2 z:1 - /bonusalphabet reset q:1",
    roomCreatorRequired: true,
    accessibleInRound: false,
    handler: (ctx) => {
        if (ctx.room.roomState.gameData!.milestone.name !== "seating") {
            ctx.utils.sendChatMessage(
                t("error.roomState.cannotSetBonusAlphabet", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        const gameData = ctx.room.roomState.gameData!;
        const dictionaryId = gameData.rules.dictionaryId;
        const languageDefault = BirdBotUtils.getDefaultBonusAlphabet(dictionaryId);
        const allTokens = [...ctx.args, ...ctx.params];
        const wantsDefault = allTokens.includes("default");
        const wantsReset = allTokens.includes("reset");

        if (wantsDefault) {
            BirdBotUtils.setRoomGameRuleIfDifferent(ctx, "customBonusAlphabet", languageDefault);
            ctx.utils.sendChatMessage(
                t("command.changeBonusAlphabet.setting", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        const letterOverrides: [string, number][] = [];
        const letterArgSource = ctx.normalizedTextAfterCommand;
        const matches = letterArgSource.match(/[a-z]:([0-9]{1,2})/gi) ?? [];
        for (const match of matches) {
            const letter = match[0]!.toLowerCase();
            const count = Number(match.slice(2));
            if (!alphabet.includes(letter)) continue;
            letterOverrides.push([letter, count]);
        }

        if (letterOverrides.length === 0 && !wantsReset) {
            ctx.utils.sendChatMessage(
                t("command.changeBonusAlphabet.invalidFormat", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        if (letterOverrides.some(([, count]) => count > 99 || count < 0)) {
            ctx.utils.sendChatMessage(
                t("command.changeBonusAlphabet.invalidRange", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        const base: CustomBonusAlphabet = wantsReset
            ? Object.fromEntries(Object.keys(languageDefault).map((letter) => [letter, 0]))
            : { ...languageDefault };

        const newAlphabet: CustomBonusAlphabet = {
            ...base,
            ...Object.fromEntries(letterOverrides),
        };

        BirdBotUtils.setRoomGameRuleIfDifferent(ctx, "customBonusAlphabet", newAlphabet);
        ctx.utils.sendChatMessage(
            t("command.changeBonusAlphabet.setting", {
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const destroyRoomCommand = c({
    id: "destroyRoom",
    aliases: ["destroy", "dr", "destroyroom"],
    usageDesc: "/destroy",
    exampleUsage: "/destroy",
    roomCreatorRequired: true,
    accessibleInRound: true,
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            t("command.destroyRoom.destroying", {
                lng: l(ctx),
            }),
        );
        Utilitary.destroyRoom(ctx.bot.rawBot, ctx.room.rawRoom);
    },
}) satisfies Command;

const getBombCommand = c({
    id: "getBomb",
    aliases: ["getbomb", "boom", "bomb"],
    usageDesc: "/boom",
    exampleUsage: "/boom",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            t("command.getBomb.result", {
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const getDefinitionCommand = c({
    id: "getDefinition",
    aliases: ["definition", "d", "def"],
    usageDesc: "/d [word] [page] (-language)",
    exampleUsage: "/d test — /d test 2 — /d -fr maison 1",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        const targetLanguageParam = BirdBotUtils.findValueInAliasesObject(ctx.params, languageAliases);
        const currentRoomLanguage =
            dictionaryIdToBirdbotLanguage[ctx.room.roomState.gameData!.rules.dictionaryId as BirdBotSupportedDictionaryId];
        const targetLanguage = targetLanguageParam ?? currentRoomLanguage ?? defaultLanguage;

        const pageNumber = BirdBotUtils.findNumberInArgs(ctx.args);
        const word = ctx.args.find((arg) => isNaN(Number(arg)));
        if (!word) {
            ctx.utils.sendChatMessage(
                t("error.invalidParams.mustProvideWord", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        const pageIndex = pageNumber !== null && pageNumber > 0 ? pageNumber - 1 : 0;
        const result = await BirdBotDefinitions.getDefinition(targetLanguage, word.toLowerCase());

        if (!ctx.room.isHealthy()) {
            return;
        }

        if ("error" in result) {
            if (result.error === 405) {
                ctx.utils.sendChatMessage(
                    t("command.getDefinition.notSupported", {
                        language: t(`lib.language.${targetLanguage}.name`, { lng: l(ctx) }),
                        lng: l(ctx),
                    }),
                );
                return;
            }
            if (result.suggestion) {
                ctx.utils.sendChatMessage(
                    t("command.getDefinition.notFoundSuggestion", {
                        suggestion: result.suggestion,
                        lng: l(ctx),
                    }),
                );
                return;
            }
            ctx.utils.sendChatMessage(
                t("command.getDefinition.notFound", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        if (result.definitions.length === 0) {
            ctx.utils.sendChatMessage(
                t("command.getDefinition.notFound", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        const effectivePage = Math.min(Math.max(0, pageIndex), result.definitions.length - 1);
        ctx.utils.sendChatMessage(
            t("command.getDefinition.result", {
                word: word.toLowerCase(),
                source: result.source,
                page: effectivePage + 1,
                total: result.definitions.length,
                definition: result.definitions[effectivePage]!,
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const testWordCommand = c({
    id: "testWord",
    aliases: ["testword", "test"],
    usageDesc: "/testword [word]",
    exampleUsage: "/testword example",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        if (!ctx.utils.userIsAdmin(ctx.gamer.authId) && !(await BirdBotModerationService.isTrusted(ctx.gamer.authId))) {
            ctx.utils.sendChatMessage(t("parity.dictionary.trustedReviewer", { lng: l(ctx) }), "error");
            return;
        }
        const words = ctx.args
            .flatMap((value) => value.split(/[,;]+/))
            .map((value) => value.replace(/[^a-z'-]/g, ""))
            .filter(Boolean);
        if (words.length === 0) {
            ctx.utils.sendChatMessage(
                t("error.invalidParams.mustProvideWord", {
                    lng: l(ctx),
                }),
            );
            return;
        }
        const dictionaryId = ctx.room.roomState.gameData!.rules.dictionaryId;
        const language = dictionaryIdToBirdbotLanguage[dictionaryId as BirdBotSupportedDictionaryId] ?? defaultLanguage;
        const dictionary = ctx.bot.getResource<DictionaryResource>(`dictionary-${language}`);
        const alreadyQueued: string[] = [];
        const added: string[] = [];
        for (const word of words) {
            if (dictionary.metadata.testWords.some((item) => item.word === word)) {
                alreadyQueued.push(word);
            } else {
                dictionary.metadata.testWords.push({
                    word,
                    callbackRoomCode: ctx.room.constantRoomData.roomCode,
                });
                added.push(word);
            }
        }
        ctx.utils.sendChatMessage(
            `Dictionary QA queued: ${added.join(", ") || "none"}; already queued: ${alreadyQueued.join(", ") || "none"}.`,
        );
    },
}) satisfies Command;

const changeListCommand = c({
    id: "changeList",
    aliases: ["changelist", "cl"],
    usageDesc: "/cl [language] [list] [add|remove] [words...]",
    exampleUsage: "/cl en plant add sunflower",
    accessibleInRound: true,
    handler: async (ctx) => {
        if (!ctx.utils.userIsAdmin(ctx.gamer.authId) && !(await BirdBotModerationService.isTrusted(ctx.gamer.authId))) {
            ctx.utils.sendChatMessage(t("parity.dictionary.trustedListReviewer", { lng: l(ctx) }), "error");
            return;
        }
        const language = BirdBotUtils.findValueInAliasesObject([ctx.args[0] ?? ""], languageAliases);
        const list = BirdBotUtils.findValueInAliasesObject([ctx.args[1] ?? ""], recordAliases);
        const action = ctx.args[2];
        const adding = ["add", "a", "ad"].includes(action);
        const removing = ["remove", "rem", "delete", "del", "r", "d"].includes(action);
        if (!language || !list || !listedRecordsPerLanguage[language].includes(list as any) || (!adding && !removing)) {
            ctx.utils.sendChatMessage(t("parity.dictionary.listUsage", { lng: l(ctx) }), "info");
            return;
        }
        const resource = ctx.bot.getResource<ListedRecordListResource>(`list-${list}-${language}`);
        const words = ctx.args
            .slice(3)
            .flatMap((value) => value.split(/[,;]+/))
            .map((value) => value.replace(/[^a-z'-]/g, ""))
            .filter(Boolean);
        const changed: string[] = [];
        const ignored: string[] = [];
        for (const word of words) {
            const index = resource.resource.indexOf(word);
            if (adding && index === -1) {
                resource.resource.push(word);
                changed.push(word);
            } else if (removing && index !== -1) {
                resource.resource.splice(index, 1);
                changed.push(word);
            } else {
                ignored.push(word);
            }
        }
        if (changed.length > 0) {
            resource.resource.sort((a, b) => a.localeCompare(b));
            await writeFile(resource.metadata.resourceFilePath, resource.resource.join("\n"));
        }
        ctx.utils.sendChatMessage(
            `List ${adding ? "added" : "removed"}: ${changed.join(", ") || "none"}; ignored: ${ignored.join(", ") || "none"}.`,
        );
    },
}) satisfies Command;

const rareSyllablesCommand = c({
    id: "rareSyllables",
    aliases: ["raresyllables", "raresyll", "rares", "rs"],
    usageDesc: "/rareSyllables [word]",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        const paramLanguage = BirdBotUtils.findValueInAliasesObject(ctx.params, languageAliases);
        const targetWord = ctx.args[0];

        if (!targetWord?.length) {
            ctx.utils.sendChatMessage(
                t("error.invalidParams.mustProvideWord", {
                    lng: l(ctx),
                }),
            );
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
            ctx.utils.sendChatMessage(
                t("error.404.word", {
                    lng: l(ctx),
                }),
            );
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
                    }),
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
                    languageFlag: t(`lib.language.${targetLanguage}.flag`, { lng: l(ctx) }),
                    word: targetWord,
                    rareSyllables: rareSyllables.map((s) => `${s.syllable}: ${s.count}`).join(", "),
                    lng: l(ctx),
                }),
            );
        } else {
            ctx.utils.sendChatMessage(
                t("command.rareSyllables.noneFound", {
                    languageFlag: t(`lib.language.${targetLanguage}.flag`),
                    word: targetWord,
                    lng: l(ctx),
                }),
            );
        }
    },
}) satisfies Command;

const linkAccountCommand = c({
    id: "linkAccount",
    aliases: ["link"],
    usageDesc: "/link [token]",
    accessibleInRound: true,
    handler: async (ctx) => {
        if (!ctx.gamer.authId) {
            ctx.utils.sendChatMessage(t("error.platform.mustBeLoggedIn", { lng: l(ctx) }));
            return;
        }

        const token = ctx.args[0];
        if (!token) {
            ctx.utils.sendChatMessage(t("error.invalidParams.mustProvideToken", { lng: l(ctx) }));
            return;
        }

        try {
            const response = await fetch(`${API_URL}/link-account`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${API_KEY}`,
                },
                body: JSON.stringify({
                    accountName: ctx.gamer.authId,
                    token,
                    currentNickname: ctx.gamer.nickname,
                }),
            });

            if (response.status === 404) {
                ctx.utils.sendChatMessage(t("command.linkAccount.tokenNotFound", { lng: l(ctx) }));
                return;
            }

            if (response.status === 200) {
                ctx.utils.sendChatMessage(t("command.linkAccount.success", { lng: l(ctx) }));
                return;
            }
        } catch (e) {
            ctx.utils.sendChatMessage(t("error.api.inaccessible", { lng: l(ctx) }));
            return;
        }
    },
}) satisfies Command;

const discordCommand = c({
    id: "discord",
    aliases: ["discord", "disc"],
    usageDesc: "/discord",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            t("command.discord.result", {
                link: DISCORD_SERVER_LINK,
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const githubCommand = c({
    id: "github",
    aliases: ["github"],
    usageDesc: "/github",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        ctx.utils.sendChatMessage(t("command.github.result", { link: GITHUB_REPO_LINK, lng: l(ctx) }));
    },
}) satisfies Command;

const donateCommand = c({
    id: "donate",
    aliases: ["donate"],
    usageDesc: "/donate",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        ctx.utils.sendChatMessage(
            t("command.donate.result", {
                link: PAYPAL_DONATE_LINK,
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const websiteCommand = c({
    id: "website",
    aliases: ["website", "site"],
    usageDesc: "/website",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        ctx.utils.sendChatMessage(t("command.website.result", { link: WEBSITE_LINK, lng: l(ctx) }));
    },
}) satisfies Command;

const uptimeCommand = c({
    id: "uptime",
    aliases: ["uptime"],
    usageDesc: "/uptime",
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: (ctx) => {
        const uptimeMs = process.uptime() * 1000;
        const uptimeString = Utilitary.formatTime(uptimeMs);
        ctx.utils.sendChatMessage(t("command.uptime.result", { uptime: uptimeString, lng: l(ctx) }));
    },
}) satisfies Command;

const modUserCommand = c({
    id: "modUser",
    aliases: ["mod", "mu", "moduser"],
    roomCreatorRequired: true,
    accessibleInRound: true,
    usageDesc: "/mod [username]",
    exampleUsage: "/mod dfuzer",
    handler: (ctx) => {
        const username = ctx.normalizedTextAfterCommand;
        if (!username) {
            ctx.utils.sendChatMessage(
                t("error.invalidParams.noUsername", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        const gamer = BirdBotUtils.findBestUsernameMatch(username, ctx.room.roomState.roomData!.chatters);
        if (!gamer) {
            ctx.utils.sendChatMessage(
                t("error.404.player", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        ctx.utils.setUserModerator(gamer.peerId, true);
        gamer.isModerator = true;
        ctx.utils.sendChatMessage(
            t("command.modUser.modding", {
                username: gamer.nickname,
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const unmodUserCommand = c({
    id: "unmodUser",
    aliases: ["unmod", "um", "unmoduser"],
    roomCreatorRequired: true,
    accessibleInRound: true,
    usageDesc: "/unmod [username]",
    handler: (ctx) => {
        const username = ctx.normalizedTextAfterCommand;
        if (!username) {
            ctx.utils.sendChatMessage(
                t("error.invalidParams.noUsername", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        const gamer = BirdBotUtils.findBestUsernameMatch(username, ctx.room.roomState.roomData!.chatters);
        if (!gamer) {
            ctx.utils.sendChatMessage(
                t("error.404.player", {
                    lng: l(ctx),
                }),
            );
            return;
        }

        ctx.utils.setUserModerator(gamer.peerId, false);
        gamer.isModerator = false;
        ctx.utils.sendChatMessage(
            t("command.unmodUser.unmodding", {
                username: gamer.nickname,
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const privateRoomCommand = c({
    id: "privateRoom",
    aliases: ["private", "priv", "pv"],
    usageDesc: "/private",
    roomCreatorRequired: true,
    accessibleInRound: true,
    allowedFromWordInput: true,
    hidden: true,
    handler: (ctx) => {
        ctx.utils.setRoomPublic(false);
        ctx.utils.sendChatMessage(
            t("command.privateRoom.setting", {
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const publicRoomCommand = c({
    id: "publicRoom",
    aliases: ["public", "pub", "pb"],
    usageDesc: "/public",
    roomCreatorRequired: true,
    accessibleInRound: true,
    allowedFromWordInput: true,
    hidden: true,
    handler: (ctx) => {
        ctx.utils.setRoomPublic(true);
        ctx.utils.sendChatMessage(
            t("command.publicRoom.setting", {
                lng: l(ctx),
            }),
        );
    },
}) satisfies Command;

const createRoomCommand = c({
    id: "createRoom",
    aliases: ["createroom", "startroom", "b"],
    usageDesc: "/createroom",
    adminRequired: IS_UNSTABLE_DEV_MODE,
    accessibleInRound: true,
    allowedFromWordInput: true,
    handler: async (ctx) => {
        const gamer = ctx.gamer;
        const bot = ctx.bot.rawBot as BirdBot;
        if (!gamer.authId) {
            ctx.utils.sendChatMessage(
                t("error.platform.mustBeLoggedIn", {
                    lng: l(ctx),
                }),
            );
            return;
        }
        {
            if (bot.creatingRoomQueue.includes(gamer.authId)) {
                ctx.utils.sendChatMessage(
                    t("command.createRoom.roomBeingCreated", {
                        lng: l(ctx),
                    }),
                );
                return;
            }
            for (const roomId in bot.rooms) {
                const room = bot.rooms[roomId];
                if (room.constantRoomData.roomCreatorAuthId === gamer.authId) {
                    ctx.utils.sendChatMessage(
                        t("command.createRoom.roomAlreadyExists", {
                            roomCode: room.constantRoomData.roomCode,
                            lng: l(ctx),
                        }),
                    );
                    return;
                }
            }
        }
        const allArguments = ctx.args.concat(ctx.params);
        let targetLanguage = BirdBotUtils.findValueInAliasesObject(allArguments, languageAliases);
        targetLanguage =
            targetLanguage ??
            dictionaryIdToBirdbotLanguage[ctx.room.roomState.gameData!.rules.dictionaryId as BirdBotSupportedDictionaryId] ??
            defaultLanguage;
        const targetDictionaryId = birdbotLanguageToDictionaryId[targetLanguage];
        const targetMode = findTargetGameMode(allArguments);
        const isPrivate = allArguments.includes("private");
        let roomName = `🐤 BirdBot x ${gamer.nickname}`;
        let botName: string | undefined;
        let pictureUrl: string | undefined;
        try {
            const player = await BirdBotParityApiService.resolvePlayer(gamer.authId, true);
            const [economy, moderation] = await Promise.all([
                BirdBotParityApiService.getEconomy(player.playerId),
                BirdBotParityApiService.getModeration(player.playerId),
            ]);
            if (isPrivate && moderation.blacklisted) {
                ctx.utils.sendChatMessage(t("parity.room.blacklisted", { lng: l(ctx) }), "error");
                return;
            }
            const adminBypass = ctx.utils.userIsAdmin(gamer.authId);
            if (adminBypass || BirdBotParityApiService.hasVip(economy)) {
                botName = economy.cosmetics?.bot_name ?? undefined;
                roomName = economy.cosmetics?.room_name ? `${economy.cosmetics.room_name} 🐤` : roomName;
                pictureUrl = economy.cosmetics?.picture_url ?? undefined;
            }
        } catch {
            if (isPrivate) {
                ctx.utils.sendChatMessage(t("parity.room.verificationUnavailable", { lng: l(ctx) }), "error");
                return;
            }
            // Room creation remains available when optional profile enrichment fails.
        }

        if (
            targetLanguage !== null &&
            !birdbotSupportedDictionaryIds.includes(birdbotLanguageToDictionaryId[targetLanguage] as any)
        ) {
            ctx.utils.sendChatMessage(
                t("error.notSupported.language", {
                    language: t(`lib.language.${targetLanguage}.name`, {
                        lng: l(ctx),
                    }),
                    lng: l(ctx),
                }),
            );
            return;
        }

        bot.creatingRoomQueue.push(gamer.authId);

        setTimeout(() => {
            if (!bot || typeof bot.creatingRoomQueue !== "object") return;
            bot.creatingRoomQueue = bot.creatingRoomQueue.filter((name) => name !== gamer.authId);
        }, 1000 * 10);

        bot.createRoom({
            targetConfig: {
                dictionaryId: targetDictionaryId,
                birdbotGameMode: targetMode ?? defaultMode,
                roomKind: "owned",
                isPublic: !isPrivate,
                roomName,
                botName,
                pictureUrl,
            },
            roomCreatorAuthId: gamer.authId,
            callback: (roomCode) => {
                bot.creatingRoomQueue = bot.creatingRoomQueue.filter((name) => name !== gamer.authId);
                if (ctx.room.isHealthy()) {
                    ctx.utils.sendChatMessage(t("command.createRoom.roomCreated", { roomCode, lng: l(ctx) }));
                }
            },
            errorCallback: () => {
                bot.creatingRoomQueue = bot.creatingRoomQueue.filter((name) => name !== gamer.authId);
                if (ctx.room.isHealthy()) {
                    ctx.utils.sendChatMessage(t("command.createRoom.unknownError", { lng: l(ctx) }));
                }
            },
        });
    },
}) satisfies Command;

export const birdbotCommandRegistry = createBirdBotCommandRegistry([
    {
        name: "information",
        commands: [
            helpCommand,
            recordsCommand,
            playerProfileCommand,
            playerRecordsCommand,
            xpCommand,
            currentGameScoresCommand,
            searchWordsCommand,
            showTimeCommand,
            rareSyllablesCommand,
            getBombCommand,
            getDefinitionCommand,
            testWordCommand,
            changeListCommand,
            discordCommand,
            githubCommand,
            donateCommand,
            websiteCommand,
            uptimeCommand,
        ],
    },
    {
        name: "room",
        commands: [
            createRoomCommand,
            setGameModeCommand,
            setPlaystyleCommand,
            trainCommand,
            setRoomLanguageCommand,
            changeBonusAlphabetCommand,
            startGameCommand,
            modUserCommand,
            unmodUserCommand,
            privateRoomCommand,
            publicRoomCommand,
            destroyRoomCommand,
        ],
    },
    {
        name: "account",
        commands: [linkAccountCommand, ...birdBotParityCommands],
    },
    {
        name: "vip",
        commands: birdBotVipCommands,
    },
    {
        name: "administration",
        commands: birdBotAdminCommands,
    },
] satisfies { name: string; commands: Command[] }[]);
export const birdbotCommands = birdbotCommandRegistry.commands;
