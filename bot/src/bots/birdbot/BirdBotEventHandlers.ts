import Logger from "../../lib/class/Logger.class";
import type { CommandDispatchResult } from "../../lib/class/CommandUtils.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { CommonEventHandlers as CommonEH } from "../../lib/handlers/CommonEventHandlers.class";
import CommonTEH from "../../lib/handlers/DataTrackingEventHandlers.class";
import type { BotEventHandlers } from "../../lib/types/libEventTypes";
import type BirdBot from "./BirdBot.class";
import { birdbotCommands } from "./BirdBotCommands";
import {
    birdbotModeRules,
    birdbotSupportedDictionaryIds,
    listedRecordsPerLanguage,
    recordsUtils,
    scoreKeyPerListedRecord,
} from "./BirdBotConstants";
import type {
    BirdBotRecordType,
    BirdBotRoomMetadata,
    BirdBotWordMilestone,
    BirdbotRoomTargetConfig,
    ListedRecordListResource,
} from "./BirdBotTypes";
import BirdBotUtils from "./BirdBotUtils.class";
import BirdBotGameplayStateService from "./services/BirdBotGameplayState.service";
import BirdBotModerationService from "./services/BirdBotModeration.service";
import BirdBotParityApiService from "./services/BirdBotParityApi.service";
import BirdBotTrainingService from "./services/BirdBotTraining.service";
import { l, t } from "./texts/BirdBotTextUtils";

function reportCommandDispatchResult(
    ctx: Parameters<typeof BirdBotUtils.handleMyTurn>[0],
    result: CommandDispatchResult,
    rawCommand: string,
): void {
    const feedback: Partial<Record<CommandDispatchResult, { key: string; style: "error" | "info" | "important" }>> = {
        "no-command-given": { key: "eventHandler.chat.noCommandGiven", style: "error" },
        "command-not-found": { key: "eventHandler.chat.commandNotFound", style: "error" },
        "not-room-creator": { key: "eventHandler.chat.notRoomCreator", style: "error" },
        "not-admin": { key: "eventHandler.chat.notAdmin", style: "error" },
        "not-accessible-in-round": { key: "eventHandler.chat.notAccessibleInRound", style: "info" },
        "not-allowed-from-word-input": { key: "eventHandler.chat.notAllowedFromWordInput", style: "info" },
        cooldown: { key: "eventHandler.chat.cooldown", style: "important" },
    };
    const denied = feedback[result];
    if (!denied) return;
    ctx.utils.sendChatMessage(t(denied.key, { command: rawCommand, lng: l(ctx) }), denied.style);
}

function handleSuccessfulWord(ctx: Parameters<typeof BirdBotUtils.handleMyTurn>[0], previousHandlersCtx: Record<string, any>) {
    const playerPeerId = previousHandlersCtx.playerPeerId as number;
    const word = previousHandlersCtx.word as string;
    const turnKey = previousHandlersCtx.turnKey as string;

    const gameData = ctx.room.roomState.gameData!;
    if (gameData.milestone.name !== "round") return;

    const currentPrompt = gameData.milestone.syllable;
    const currentChatter = ctx.room.roomState.roomData!.chatters.find((c) => c.peerId === playerPeerId);
    if (!currentChatter) {
        throw new Error("Current chatter is not set");
    }
    const isMe = ctx.room.roomState.myPeerId === playerPeerId;
    const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
    if (roomMetadata.scoredWordTurnKeys.has(turnKey)) return;
    roomMetadata.scoredWordTurnKeys.add(turnKey);
    if (roomMetadata.scoresByPeerId[playerPeerId] === undefined) {
        BirdBotUtils.initializeScoresForPlayerId(roomMetadata, playerPeerId);
    }
    const playerScores = roomMetadata.scoresByPeerId[playerPeerId]!;
    const scoresBeforeWord = { ...playerScores };
    const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
    const currentRoomLanguage = BirdBotUtils.getCurrentRoomLanguage(ctx);
    const submitIsInDictionary = currentDictionaryResource.resource.includes(word);

    let showWord = false;
    const turnComments: string[] = [];

    playerScores.words++;
    playerScores.currentWordsWithoutDeath++;

    const trainingFeedback = BirdBotTrainingService.evaluateCreatorWord(ctx, currentChatter.authId, word, currentPrompt);
    if (trainingFeedback) ctx.utils.sendChatMessage(trainingFeedback);
    if (playerScores.currentWordsWithoutDeath > playerScores.maxWordsWithoutDeath) {
        const oldMax = playerScores.maxWordsWithoutDeath;
        playerScores.maxWordsWithoutDeath = playerScores.currentWordsWithoutDeath;
        const passedMilestone = BirdBotUtils.passedMilestone(oldMax, playerScores.maxWordsWithoutDeath, 50);
        if (passedMilestone) {
            turnComments.push(
                t("eventHandler.submit.comments.reachedWordsNoDeath", {
                    count: playerScores.maxWordsWithoutDeath,
                    lng: l(ctx),
                }),
            );
        }
    }

    if (word.length >= 20) {
        playerScores.moreThan20LettersWords++;
        roomMetadata.globalScores.moreThan20LettersWords++;
        turnComments.push(
            t("eventHandler.submit.comments.placedLongWord", {
                playerTotal: playerScores.moreThan20LettersWords,
                globalTotal: roomMetadata.globalScores.moreThan20LettersWords,
                lng: l(ctx),
            }),
        );
        showWord = true;
    }

    if (word.includes("-")) {
        playerScores.hyphenWords++;
        roomMetadata.globalScores.hyphenWords++;
        turnComments.push(
            t("eventHandler.submit.comments.placedHyphenatedWord", {
                playerTotal: playerScores.hyphenWords,
                globalTotal: roomMetadata.globalScores.hyphenWords,
                lng: l(ctx),
            }),
        );
        showWord = true;
    }

    const currentPlayerAlphaLetter = String.fromCharCode(65 + (playerScores.alpha % 26)).toLowerCase();
    if (word[0] === currentPlayerAlphaLetter) {
        const oldAlpha = playerScores.alpha;
        playerScores.alpha++;
        const passedMilestone = BirdBotUtils.passedMilestone(oldAlpha, playerScores.alpha, 26);
        if (passedMilestone) {
            turnComments.push(
                t("eventHandler.submit.comments.completedAlpha", {
                    alphaString: recordsUtils.alpha.format(playerScores.alpha),
                    lng: l(ctx),
                }),
            );
        }
    }

    if (playerScores.previousSyllable) {
        const previousSyllable = playerScores.previousSyllable;
        if (word.includes(previousSyllable)) {
            playerScores.previousSyllableScore++;
            roomMetadata.globalScores.previousSyllables++;
            turnComments.push(
                t("eventHandler.submit.comments.placedPreviousSyllable", {
                    syllable: previousSyllable.toUpperCase(),
                    playerTotal: playerScores.previousSyllableScore,
                    globalTotal: roomMetadata.globalScores.previousSyllables,
                    lng: l(ctx),
                }),
            );
            showWord = true;
        }
    }

    const multiSyllableGainedPoints = word.split(currentPrompt).length - 2;
    if (multiSyllableGainedPoints > 0) {
        playerScores.multiSyllables += multiSyllableGainedPoints;
        roomMetadata.globalScores.multiSyllables += multiSyllableGainedPoints;
        turnComments.push(
            t("eventHandler.submit.comments.gainedMultiSyllables", {
                count: multiSyllableGainedPoints,
                prompt: currentPrompt.toUpperCase(),
                multiplier: multiSyllableGainedPoints + 1,
                playerTotal: playerScores.multiSyllables,
                globalTotal: roomMetadata.globalScores.multiSyllables,
                lng: l(ctx),
            }),
        );
        showWord = true;
    }

    const depletedSyllables: string[] = [];
    if (submitIsInDictionary) {
        const splitWord = BirdBotUtils.splitWordIntoSyllables(word);
        for (const syllable in splitWord) {
            if (roomMetadata.remainingSyllables[syllable] !== undefined && roomMetadata.remainingSyllables[syllable]! > 0) {
                if (roomMetadata.remainingSyllables[syllable]! - splitWord[syllable]! >= 0) {
                    roomMetadata.remainingSyllables[syllable]! -= splitWord[syllable]!;
                    if (roomMetadata.remainingSyllables[syllable] === 0) {
                        depletedSyllables.push(syllable);
                    }
                }
            }
        }
    }
    if (depletedSyllables.length > 0) {
        playerScores.depletedSyllables += depletedSyllables.length;
        roomMetadata.globalScores.depletedSyllables += depletedSyllables.length;
        turnComments.push(
            t("eventHandler.submit.comments.depletedSyllables", {
                count: depletedSyllables.length,
                syllables: depletedSyllables.join(", ").toUpperCase(),
                playerTotal: playerScores.depletedSyllables,
                globalTotal: roomMetadata.globalScores.depletedSyllables,
                lng: l(ctx),
            }),
        );
    }

    {
        const listedRecordsInLanguage = listedRecordsPerLanguage[currentRoomLanguage];
        for (const record of listedRecordsInLanguage) {
            const resource = ctx.bot.getResource<ListedRecordListResource>(`list-${record}-${currentRoomLanguage}`);
            const recordScoreKey = scoreKeyPerListedRecord[record];
            if (resource.resource.includes(word)) {
                playerScores[recordScoreKey]++;
                roomMetadata.globalScores[recordScoreKey]++;
                showWord = true;
                turnComments.push(
                    t("eventHandler.submit.comments.listedRecord", {
                        commentIntroduction: t(`eventHandler.submit.listedRecordCommentIntroductions.${record}`, {
                            lng: l(ctx),
                        }),
                        playerTotal: playerScores[recordScoreKey],
                        globalTotal: roomMetadata.globalScores[recordScoreKey],
                        lng: l(ctx),
                    }),
                );
            }
        }
    }

    let metaMilestones: BirdBotWordMilestone[] = [];
    if (currentChatter.authId && BirdBotGameplayStateService.isScoreEligible(ctx)) {
        const game = BirdBotUtils.getApiGameData(ctx);
        metaMilestones = BirdBotParityApiService.buildCategoryMilestones({
            gameId: game.id,
            turnKey,
            word,
            elapsedMs: Math.max(0, Date.now() - ctx.room.roomState.roundStartTimestamp),
            wordsUsed: playerScores.words,
            before: scoresBeforeWord,
            after: playerScores,
        });
        const reached = new Map<string, { category: BirdBotRecordType; milestone: number; speed: boolean; accuracy: boolean }>();
        for (const milestone of metaMilestones) {
            const key = `${milestone.category}:${milestone.milestone}`;
            const entry = reached.get(key) ?? {
                category: milestone.category,
                milestone: milestone.milestone,
                speed: false,
                accuracy: false,
            };
            entry.speed ||= milestone.type === "SPEED";
            entry.accuracy ||= milestone.type === "ACCURACY";
            reached.set(key, entry);
        }
        for (const entry of reached.values()) {
            const key =
                entry.speed && entry.accuracy
                    ? "eventHandler.submit.comments.reachedMetaMilestone"
                    : entry.speed
                      ? "eventHandler.submit.comments.reachedSpeedMilestone"
                      : "eventHandler.submit.comments.reachedAccuracyMilestone";
            turnComments.push(
                t(key, {
                    category: t(`lib.recordType.${entry.category}.recordName`, { lng: l(ctx) }),
                    milestone: entry.milestone,
                    lng: l(ctx),
                }),
            );
        }
    }

    if (turnComments.length > 0 && !isMe) {
        if (showWord) {
            ctx.utils.sendChatMessage(
                t("eventHandler.submit.turnCommentWithWord", {
                    username: currentChatter.nickname,
                    word: word.toUpperCase(),
                    comments: turnComments.join(" - "),
                    lng: l(ctx),
                }),
            );
        } else {
            ctx.utils.sendChatMessage(
                t("eventHandler.submit.turnCommentWithoutWord", {
                    username: currentChatter.nickname,
                    comments: turnComments.join(" - "),
                    lng: l(ctx),
                }),
            );
        }
    }

    if (!submitIsInDictionary) {
        if (isMe) {
            if (!currentDictionaryResource.resource.includes(word)) {
                ctx.utils.sendChatMessage(t("parity.dictionary.unknownAdded", { word, lng: l(ctx) }), "success");
                BirdBotUtils.handleWordAdditionToDictionaryResource(ctx, currentRoomLanguage, word);
            }
            currentDictionaryResource.metadata.testWords = currentDictionaryResource.metadata.testWords.filter(
                (testWord) => testWord.word !== word,
            );
        } else if (!currentDictionaryResource.metadata.testWords.some((testWord) => testWord.word === word)) {
            currentDictionaryResource.metadata.testWords.push({
                word,
                callbackRoomCode: ctx.room.constantRoomData.roomCode,
            });
            ctx.utils.sendChatMessage(t("parity.dictionary.unknownTested", { word, lng: l(ctx) }), "info");
        }
    }

    if (currentChatter.authId && BirdBotGameplayStateService.isScoreEligible(ctx)) {
        const game = BirdBotUtils.getApiGameData(ctx);
        BirdBotUtils.queueSuccessfulWordRegistration(ctx, turnKey, {
            word,
            submitResult: "success",
            prompt: currentPrompt,
            game,
            player: BirdBotUtils.getApiPlayerData(currentChatter),
            durationMs: previousHandlersCtx.durationMs,
            reactionMs: previousHandlersCtx.reactionMs,
            milestones: metaMilestones,
        });
    }
}

function handleFlip(ctx: Parameters<typeof BirdBotUtils.handleMyTurn>[0], previousHandlersCtx: Record<string, any>) {
    const playerPeerId = previousHandlersCtx.lifeGainPeerId as number | undefined;
    const turnKey = previousHandlersCtx.flipTurnKey as string | undefined;
    if (playerPeerId === undefined || !turnKey) return;

    const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
    if (roomMetadata.flipTurnKeys.has(turnKey)) return;
    if (roomMetadata.scoresByPeerId[playerPeerId] === undefined) {
        BirdBotUtils.initializeScoresForPlayerId(roomMetadata, playerPeerId);
    }
    const playerScores = roomMetadata.scoresByPeerId[playerPeerId]!;
    const oldFlips = playerScores.flips;
    playerScores.flips++;
    roomMetadata.globalScores.flips++;
    const chatter = ctx.room.roomState.roomData?.chatters.find((item) => item.peerId === playerPeerId);
    const pending = roomMetadata.pendingWordRegistrations.get(turnKey);
    let reachedMetaMilestone: number | null = null;
    if (chatter?.authId && pending && BirdBotGameplayStateService.isScoreEligible(ctx)) {
        const extraMilestones = BirdBotParityApiService.buildCategoryMilestones({
            gameId: pending.data.game.id,
            turnKey,
            word: pending.data.word,
            elapsedMs: Math.max(0, Date.now() - ctx.room.roomState.roundStartTimestamp),
            wordsUsed: playerScores.words,
            before: { ...playerScores, flips: oldFlips },
            after: playerScores,
        });
        pending.data.milestones = [...(pending.data.milestones ?? []), ...extraMilestones];
        reachedMetaMilestone = extraMilestones[0]?.milestone ?? null;
    }
    BirdBotUtils.markFlipForTurn(ctx, turnKey);
    const passedMilestone = BirdBotUtils.passedMilestone(oldFlips, playerScores.flips, 4);
    if ((!passedMilestone && !reachedMetaMilestone) || ctx.room.roomState.myPeerId === playerPeerId || !chatter) return;
    const comments = [];
    if (passedMilestone) {
        comments.push(
            t("eventHandler.submit.comments.gainedLives", {
                count: playerScores.flips,
                playerTotal: playerScores.flips,
                globalTotal: roomMetadata.globalScores.flips,
                lng: l(ctx),
            }),
        );
    }
    if (reachedMetaMilestone) {
        comments.push(
            t("eventHandler.submit.comments.reachedMetaMilestone", {
                category: t("lib.recordType.flips.recordName", { lng: l(ctx) }),
                milestone: reachedMetaMilestone,
                lng: l(ctx),
            }),
        );
    }
    ctx.utils.sendChatMessage(
        t("eventHandler.submit.turnCommentWithoutWord", {
            username: chatter.nickname,
            comments: comments.join(" - "),
            lng: l(ctx),
        }),
    );
}

const birdbotEventHandlers: BotEventHandlers = {
    chatDisconnect: [CommonEH.chatDisconnect, CommonEH.attemptToReconnectOnDisconnect],
    gameDisconnect: [
        (ctx) => {
            const metadata = ctx.room.roomState.metadata as Partial<BirdBotRoomMetadata>;
            if (metadata.pendingWordRegistrations) BirdBotUtils.flushAllWordRegistrations(ctx);
        },
        CommonEH.gameDisconnect,
        CommonEH.attemptToReconnectOnDisconnect,
    ],
    chat: {
        chat: (ctx) => {
            const author = ctx.message.args[0];
            const rawMessage = ctx.message.args[1] as string;
            if (!author || author.peerId === ctx.room.roomState.myPeerId) return;

            let chatter = ctx.room.roomState.roomData?.chatters.find((c) => c.peerId === author.peerId);
            if (!chatter) {
                chatter = Utilitary.profileToChatter(author);
                ctx.room.roomState.roomData?.chatters.push(chatter);
            }

            if (!BirdBotModerationService.handleChatMessage(ctx, chatter, rawMessage)) return;
            const handleCommandResult = Utilitary.handleCommandIfExists(ctx, rawMessage, chatter, birdbotCommands, {
                isScoreEligible: BirdBotGameplayStateService.isScoreEligible(ctx),
            });
            reportCommandDispatchResult(ctx, handleCommandResult, rawMessage);
        },
        chatterAdded: [
            CommonTEH.chatterAdded,
            async (ctx, previousHandlersCtx) => {
                const newPeerId = previousHandlersCtx.newPeerId as number;
                const chatter = ctx.room.roomState.roomData!.chatters.find((item) => item.peerId === newPeerId);
                if (!chatter) return;
                await BirdBotModerationService.handleChatterAdded(ctx, chatter);
                if (chatter.isBanned) return;

                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                if (roomMetadata.wasInitialized && !roomMetadata.greetedPeerIds.has(newPeerId.toString())) {
                    roomMetadata.greetedPeerIds.add(newPeerId.toString());
                    if (chatter.authId) {
                        try {
                            const player = await BirdBotParityApiService.resolvePlayer(chatter.authId, true);
                            const economy = await BirdBotParityApiService.getEconomy(player.playerId);
                            if (
                                economy.cosmetics?.welcome_message &&
                                (ctx.utils.userIsAdmin(chatter.authId) || (economy.vip && economy.vip.tier !== "NONE"))
                            ) {
                                ctx.utils.sendChatMessage(
                                    economy.cosmetics.welcome_message.replace(/µ\{n\}/gi, chatter.nickname),
                                    "important",
                                );
                                return;
                            }
                        } catch {
                            // A greeting must not fail because profile enrichment is unavailable.
                        }
                    }
                    ctx.utils.sendChatMessage(t("general.greet", { lng: l(ctx) }), "info");
                }
            },
        ],
        chatterRemoved: CommonTEH.chatterRemoved,
        setPlayerCount: CommonTEH.setPlayerCount,
        userBanned: [
            CommonTEH.userBanned,
            (ctx, previousHandlersCtx) => {
                const bannedPeerId = previousHandlersCtx.bannedPeerId as number | undefined;
                const bannedUser = previousHandlersCtx.bannedUser as { authId?: string | null; peerId?: number } | undefined;
                if (bannedPeerId === undefined) return;
                const moderators = (ctx.room.roomState.roomData?.chatters ?? [])
                    .filter((item) => item.isModerator && item.authId)
                    .map((item) => item.authId!);
                const playerAccount = bannedUser?.authId || `peerId:${bannedPeerId}`;
                void BirdBotParityApiService.createBanEvent({
                    playerAccount,
                    roomCode: ctx.room.constantRoomData.roomCode,
                    moderatorAccounts: moderators,
                }).catch(() => {
                    // best-effort audit
                });
            },
        ],
    },
    game: {
        setup: [
            (ctx) => {
                const metadata = ctx.room.roomState.metadata as Partial<BirdBotRoomMetadata>;
                if (metadata.pendingWordRegistrations) {
                    BirdBotUtils.flushAllWordRegistrations(ctx);
                }
            },
            CommonTEH.setup,
            (ctx, previousHandlersCtx) => {
                const selfPeerId = previousHandlersCtx.selfPeerId as number;
                const leaderPeerId = previousHandlersCtx.leaderPeerId as number;
                const isFirstSetup = previousHandlersCtx.isFirstSetup as boolean;

                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                if (!roomMetadata.wasInitialized) {
                    BirdBotUtils.setupRoomMetadata(ctx);
                }
                const targetConfig = ctx.room.constantRoomData.targetConfig as BirdbotRoomTargetConfig;
                if (ctx.room.roomState.gameData?.milestone.name === "round") {
                    (ctx.bot.rawBot as BirdBot).setEphemeralIdleSince(ctx.room.rawRoom, null);
                } else if (targetConfig.roomKind === "ephemeral" && typeof targetConfig.ephemeralIdleSince !== "number") {
                    // The bot may have restarted while a round was active. Begin a fresh idle
                    // window if that round ended while the bot was disconnected.
                    (ctx.bot.rawBot as BirdBot).setEphemeralIdleSince(ctx.room.rawRoom, Date.now());
                }

                if (selfPeerId !== leaderPeerId) {
                    Logger.log({
                        message: "Bot is not the room leader. Destroying room.",
                        path: "BirdBotEventHandlers.ts",
                    });
                    Utilitary.destroyRoom(ctx.bot.rawBot, ctx.room.rawRoom);
                    return;
                }

                if (isFirstSetup && ctx.room.constantRoomData.targetConfig) {
                    const birdbotTargetConfig = ctx.room.constantRoomData.targetConfig as BirdbotRoomTargetConfig;
                    const targetGameMode = BirdBotUtils.isMainRoom(ctx) ? "regular" : birdbotTargetConfig.birdbotGameMode;
                    BirdBotUtils.setRoomGameMode(ctx, birdbotModeRules[targetGameMode]);
                    BirdBotUtils.setRoomDictionary(ctx, birdbotTargetConfig.dictionaryId);
                    ctx.utils.joinRound();
                } else {
                    BirdBotUtils.detectRoomGameMode(ctx);
                    if (ctx.room.roomState.gameData!.milestone.name === "seating") {
                        ctx.utils.joinRound();
                    } else if (ctx.room.roomState.gameData!.milestone.name === "round") {
                        const milestone = ctx.room.roomState.gameData!.milestone;
                        for (const [peerIdStr, state] of Object.entries(milestone.playerStatesByPeerId)) {
                            if (!state.wasWordValidated || !state.word) continue;
                            const turnKey = `${peerIdStr}:${state.startTurn ?? "unknown"}`;
                            if (roomMetadata.scoredWordTurnKeys.has(turnKey)) continue;
                            handleSuccessfulWord(ctx, {
                                playerPeerId: Number(peerIdStr),
                                word: state.word,
                                turnKey,
                                durationMs: undefined,
                                reactionMs: undefined,
                            });
                        }
                        BirdBotUtils.handleMyTurn(ctx, {});
                    }
                }
            },
        ],
        setMilestone: [
            (ctx) => BirdBotUtils.flushAllWordRegistrations(ctx),
            CommonTEH.setMilestone,
            (ctx, previousHandlersCtx) => {
                if (previousHandlersCtx.roundEnded) {
                    (ctx.bot.rawBot as BirdBot).setEphemeralIdleSince(ctx.room.rawRoom, Date.now());
                    BirdBotGameplayStateService.clearRoundScoreBlock(ctx);
                    ctx.utils.joinRound();
                    BirdBotUtils.resetRoomMetadata(ctx);
                }
                if (previousHandlersCtx.roundStarted) {
                    (ctx.bot.rawBot as BirdBot).setEphemeralIdleSince(ctx.room.rawRoom, null);
                    const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                    const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
                    roomMetadata.remainingSyllables = Object.assign({}, currentDictionaryResource.metadata.syllablesCount);
                    BirdBotUtils.initializeScoresForAllPlayers(ctx);

                    if (
                        birdbotSupportedDictionaryIds.includes(ctx.room.roomState.gameData!.rules.dictionaryId as any) &&
                        BirdBotGameplayStateService.isScoreEligible(ctx)
                    ) {
                        const gameData = BirdBotUtils.getApiGameData(ctx);
                        BirdBotUtils.registerGame(gameData);
                    }
                    BirdBotUtils.handleMyTurn(ctx, {});
                }
            },
        ],
        setRules: [
            CommonTEH.setRules,
            (ctx) => {
                BirdBotGameplayStateService.resetIfLanguageChanged(ctx);
                BirdBotUtils.detectRoomGameMode(ctx);
            },
        ],
        setDictionaryManifest: CommonTEH.setDictionaryManifest,
        addPlayer: CommonTEH.addPlayer,
        updatePlayer: CommonTEH.updatePlayer,
        removePlayer: CommonTEH.removePlayer,
        clearUsedWords: [
            CommonTEH.clearUsedWords,
            (ctx) => {
                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
                roomMetadata.remainingSyllables = Object.assign({}, currentDictionaryResource.metadata.syllablesCount);
            },
        ],
        nextTurn: [
            (ctx) => BirdBotUtils.flushAllWordRegistrations(ctx),
            CommonTEH.nextTurn,
            BirdBotUtils.handleMyTurn,
            (ctx, previousHandlersCtx) => {
                const previousPeerId = previousHandlersCtx.previousPeerId as number;
                const previousPrompt = previousHandlersCtx.previousPrompt as string;
                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                const previousPlayerScores = roomMetadata.scoresByPeerId[previousPeerId];
                if (previousPlayerScores) {
                    previousPlayerScores.previousSyllable = previousPrompt;
                }
            },
        ],
        livesLost: [
            CommonTEH.livesLost,
            (ctx, previousHandlersCtx) => {
                const lostLifePeerId = previousHandlersCtx.lostLifePeerId as number | undefined;
                const deadPeerId = previousHandlersCtx.deadPeerId as number | undefined;
                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                if (lostLifePeerId !== undefined) {
                    const playerScores = roomMetadata.scoresByPeerId[lostLifePeerId];
                    if (playerScores) {
                        playerScores.currentWordsWithoutDeath = 0;
                    }
                }
                if (deadPeerId !== undefined) {
                    BirdBotUtils.handlePlayerDeath(ctx, deadPeerId);
                }
            },
        ],
        bonusAlphabetCompleted: [CommonTEH.bonusAlphabetCompleted, handleFlip],
        setPlayerWord: CommonTEH.setPlayerWord,
        correctWord: [
            CommonTEH.correctWord,
            (ctx, previousHandlersCtx) => {
                handleSuccessfulWord(ctx, previousHandlersCtx);
            },
        ],
        failWord: [
            CommonTEH.failWord,
            (ctx, previousHandlersCtx) => {
                const playerPeerId = previousHandlersCtx.playerPeerId as number;
                const reason = previousHandlersCtx.reason as string;
                const gameData = ctx.room.roomState.gameData!;
                if (gameData.milestone.name !== "round") return;

                const state = gameData.milestone.playerStatesByPeerId[String(playerPeerId)];
                if (!state) return;
                const rawWord = state.rawWord;
                const word = state.word;
                const isMe = ctx.room.roomState.myPeerId === playerPeerId;
                const currentChatter = ctx.room.roomState.roomData!.chatters.find((c) => c.peerId === playerPeerId);
                if (!currentChatter) return;

                const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
                const currentRoomLanguage = BirdBotUtils.getCurrentRoomLanguage(ctx);
                const submitIsInDictionary = currentDictionaryResource.resource.includes(word);

                if (!isMe) {
                    const handleCommandResult = Utilitary.handleCommandIfExists(ctx, rawWord, currentChatter, birdbotCommands, {
                        source: "word-input",
                        isScoreEligible: BirdBotGameplayStateService.isScoreEligible(ctx),
                    });
                    reportCommandDispatchResult(ctx, handleCommandResult, rawWord);
                }

                if (submitIsInDictionary && reason === "notInDictionary") {
                    if (isMe) {
                        const wordIndex = currentDictionaryResource.resource.indexOf(word);
                        if (wordIndex !== -1) {
                            ctx.utils.sendChatMessage(t("parity.dictionary.invalidRemoved", { word, lng: l(ctx) }), "success");
                            BirdBotUtils.handleWordRemovalFromDictionaryResource(ctx, currentRoomLanguage, wordIndex, word);
                        }
                        currentDictionaryResource.metadata.testWords = currentDictionaryResource.metadata.testWords.filter(
                            (testWord) => testWord.word !== word,
                        );
                    } else if (!currentDictionaryResource.metadata.testWords.some((testWord) => testWord.word === word)) {
                        ctx.utils.sendChatMessage(t("parity.dictionary.invalidTested", { word, lng: l(ctx) }), "info");
                        currentDictionaryResource.metadata.testWords.push({
                            word,
                            callbackRoomCode: ctx.room.constantRoomData.roomCode,
                        });
                    }
                }

                if (currentChatter.authId && BirdBotGameplayStateService.isScoreEligible(ctx)) {
                    const failTurnKey = `${playerPeerId}:${state.startTurn ?? "unknown"}`;
                    BirdBotUtils.registerWord(
                        {
                            flip: false,
                            word,
                            submitResult: "invalidWord",
                            prompt: gameData.milestone.syllable,
                            game: BirdBotUtils.getApiGameData(ctx),
                            player: BirdBotUtils.getApiPlayerData(currentChatter),
                            durationMs: state.startTurn === null ? undefined : Math.max(0, Date.now() - state.startTurn),
                            reactionMs:
                                state.startTurn === null || state.startWrite === null
                                    ? undefined
                                    : Math.max(0, state.startWrite - state.startTurn),
                        },
                        failTurnKey,
                    );
                }

                if (isMe) {
                    BirdBotUtils.handleMyTurn(ctx, {});
                }
            },
        ],
    },
};

export default birdbotEventHandlers;
