import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { CommonEventHandlers as CommonEH } from "../../lib/handlers/CommonEventHandlers.class";
import CommonTEH from "../../lib/handlers/DataTrackingEventHandlers.class";
import { RoomRole } from "../../lib/types/gameTypes";
import type { BotEventHandlers } from "../../lib/types/libEventTypes";
import { birdbotCommands } from "./BirdBotCommands";
import {
    birdbotModeRules,
    birdbotSupportedDictionaryIds,
    listedRecordsPerLanguage,
    recordsUtils,
    scoreKeyPerListedRecord,
} from "./BirdBotConstants";
import type { BirdBotRoomMetadata, BirdbotRoomTargetConfig, ListedRecordListResource } from "./BirdBotTypes";
import BirdBotUtils from "./BirdBotUtils.class";
import { l, t } from "./texts/BirdBotTextUtils";

const birdbotEventHandlers: BotEventHandlers = {
    open: CommonEH.open,
    close: [CommonEH.close, CommonEH.attemptToReconnectOnClose],
    message: {
        hello: CommonEH.hello,
        getGamerModerationInfo: CommonEH.getGamerModerationInfo,
        bye: CommonEH.bye,
        "hello.ok": [
            CommonTEH.helloOk,
            (ctx) => {
                const data = ctx.bot.networkAdapter.readHelloOkMessageData(ctx.message);
                const { myGamerId, roomData, gameData } = data;

                const myPlayer = roomData.gamers.find((gamer) => gamer.id === myGamerId);
                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                if (!roomMetadata.wasInitialized) {
                    BirdBotUtils.setupRoomMetadata(ctx);
                }
                if (myPlayer && myPlayer.role === "host" && ctx.room.constantRoomData.targetConfig) {
                    const roomTargetConfig = ctx.room.constantRoomData.targetConfig;
                    const setupMessage = ctx.bot.networkAdapter.getInitialSetupMessage({
                        dictionaryId: roomTargetConfig.dictionaryId,
                        gameMode: roomTargetConfig.gameMode,
                    });
                    ctx.room.ws!.send(setupMessage);
                } else {
                    Logger.log({
                        message:
                            "My player is not the host or the target config is not set. I don't want to deal with that... Destroying room.",
                        path: "BirdBotEventHandlers.ts",
                    });
                    Utilitary.destroyRoom(ctx.bot.rawBot, ctx.room.rawRoom);
                }
            },
        ],
        setRoomAccessMode: CommonTEH.setRoomAccessMode,
        setRole: CommonTEH.setRole,
        addGamer: [
            CommonTEH.addGamer,
            (ctx) => {
                const roomOwner = ctx.room.constantRoomData.roomCreatorUsername;
                if (!roomOwner) return;

                const gamer = ctx.room.roomState.roomData!.gamers.find((gamer) => gamer.identity.name === roomOwner);
                if (!gamer) return;
                if (gamer.role === "moderator") return;

                const message = ctx.bot.networkAdapter.getSetGamerRoleMessage({
                    gamerId: gamer.id,
                    role: "moderator" satisfies RoomRole,
                });
                ctx.room.ws!.send(message);
            },
        ],
        setGamerOnline: CommonTEH.setGamerOnline,
        chat: (ctx) => {
            const data = ctx.bot.networkAdapter.readChatData(ctx.message);
            const { gamerId, rawMessage } = data;
            if (ctx.room.roomState.myGamerId === gamerId) return;

            const gamer = ctx.room.roomState.roomData!.gamers.find((gamer) => gamer.id === gamerId);
            if (!gamer) {
                Logger.error({
                    message: `Gamer ${gamerId} not found in room ${ctx.room.constantRoomData.roomCode}.`,
                    path: "BirdBotEventHandlers.ts",
                });
                throw new Error(`Gamer ${gamerId} not found in room ${ctx.room.constantRoomData.roomCode}.`);
            }
            const handleCommandResult = Utilitary.handleCommandIfExists(ctx, rawMessage, gamer, birdbotCommands);
            if (handleCommandResult === "command-not-found") {
                ctx.utils.sendChatMessage(
                    t("eventHandler.chat.commandNotFound", {
                        command: rawMessage,
                        lng: l(ctx),
                    })
                );
            } else if (handleCommandResult === "not-room-creator") {
                ctx.utils.sendChatMessage(
                    t("eventHandler.chat.notRoomCreator", {
                        lng: l(ctx),
                    })
                );
            } else if (handleCommandResult === "not-admin") {
                ctx.utils.sendChatMessage(
                    t("eventHandler.chat.notAdmin", {
                        lng: l(ctx),
                    })
                );
            }
        },
        chatRateLimited: CommonEH.chatRateLimited,
        "getGamerModerationInfo.result": CommonEH.getGamerModerationInfoResult,
        announce: CommonEH.announce,
        announceRestart: CommonEH.announceRestart,
        session: {
            debug: CommonEH.debug,
            start: CommonEH.start,
            abort: CommonEH.abort,
            setup: [
                CommonTEH.setup,
                (ctx, previousHandlersCtx) => {
                    const isInitialSetup = previousHandlersCtx.initialSetup as true | undefined;
                    if (isInitialSetup) {
                        Logger.log({
                            message: "This is the initial setup, setting rules to default values.",
                            path: "BirdBotEventHandlers.ts",
                        });
                        const birdbotTargetConfig = ctx.room.constantRoomData.targetConfig as BirdbotRoomTargetConfig;
                        const targetGameMode = birdbotTargetConfig.birdbotGameMode;
                        BirdBotUtils.setRoomGameMode(ctx, birdbotModeRules[targetGameMode]);
                        if (ctx.room.constantRoomData.targetConfig !== null) {
                            BirdBotUtils.setRoomGameRuleIfDifferent(
                                ctx,
                                "dictionaryId",
                                ctx.room.constantRoomData.targetConfig.dictionaryId
                            );
                        }
                        const joinMessage = ctx.bot.networkAdapter.getJoinMessage();
                        ctx.room.ws!.send(joinMessage);
                    } else {
                        BirdBotUtils.detectRoomGameMode(ctx);
                    }
                },
            ],
            toggleCountdown: CommonTEH.toggleCountdown,
            addPlayer: CommonTEH.addPlayer,
            removePlayer: CommonTEH.removePlayer,
            "1v1Announcement": CommonTEH.oneVOneAnnouncement,
            roundIntro: CommonTEH.roundIntro,
            round: [
                CommonTEH.round,
                (ctx) => {
                    const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                    const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
                    const currentDictionarySyllablesCount = currentDictionaryResource.metadata.syllablesCount;
                    const clonedSyllablesCount = Object.assign({}, currentDictionarySyllablesCount);
                    roomMetadata.remainingSyllables = clonedSyllablesCount;
                    BirdBotUtils.initializeScoresForAllPlayers(ctx);

                    if (birdbotSupportedDictionaryIds.includes(ctx.room.roomState.gameData!.rules.dictionaryId as any)) {
                        const gameData = BirdBotUtils.getApiGameData(ctx);
                        Logger.log({
                            message: `Registering game ${gameData.id}`,
                            path: "BirdBotEventHandlers.ts",
                        });
                        BirdBotUtils.registerGame(gameData);
                    }
                },
                BirdBotUtils.handleMyTurn,
            ],
            roundOver: [
                CommonTEH.roundOver,
                (ctx, previousHandlersCtx) => {
                    const deadPlayerIds = previousHandlersCtx.deadPlayerIds as number[];
                    for (const deadPlayerId of deadPlayerIds) {
                        BirdBotUtils.handlePlayerDeath(ctx, deadPlayerId);
                    }
                    ctx.room.roomState.wordHistory.length = 0;
                },
            ],
            gameOver: [
                CommonTEH.gameOver,
                (ctx) => {
                    const joinMessage = ctx.bot.networkAdapter.getJoinMessage();
                    ctx.room.ws!.send(joinMessage);
                    BirdBotUtils.resetRoomMetadata(ctx);
                },
            ],
            updatePlaylistRatings: CommonEH.updatePlaylistRatings,
            explodeBomb: [CommonTEH.explodeBomb],
            nextTurn: [
                CommonTEH.nextTurn,
                BirdBotUtils.handleMyTurn,
                (ctx, previousHandlersCtx) => {
                    const previousGamerId = previousHandlersCtx.previousGamerId as number;
                    const previousPrompt = previousHandlersCtx.previousPrompt as string;
                    const deadPlayerIds = previousHandlersCtx.deadPlayerIds as number[];
                    const lostLifePlayerIds = previousHandlersCtx.lostLifePlayerIds as number[];
                    const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;

                    for (const lostLifePlayerId of lostLifePlayerIds) {
                        const playerScores = roomMetadata.scoresByGamerId[lostLifePlayerId];
                        if (playerScores === undefined) {
                            throw new Error("Player scores not found");
                        }
                        playerScores.currentWordsWithoutDeath = 0;
                    }
                    for (const deadPlayerId of deadPlayerIds) {
                        BirdBotUtils.handlePlayerDeath(ctx, deadPlayerId);
                    }

                    const previousPlayerScores = roomMetadata.scoresByGamerId[previousGamerId];
                    if (previousPlayerScores === undefined) {
                        throw new Error("Previous player scores not found");
                    }
                    previousPlayerScores.previousSyllable = previousPrompt;
                },
            ],
            submit: [
                CommonTEH.submit,
                BirdBotUtils.handleMyTurn,
                (ctx, previousHandlersCtx) => {
                    const data = ctx.bot.networkAdapter.readSubmitData(ctx.message);
                    const { result, points } = data;

                    const currentPlayer = Utilitary.getCurrentPlayer(ctx.room.roomState.gameData!);
                    if (!currentPlayer) {
                        throw new Error("Current player is not set");
                    }
                    const currentGamer = ctx.room.roomState.roomData!.gamers.find((gamer) => gamer.id === currentPlayer.gamerId);
                    if (!currentGamer) {
                        throw new Error("Current gamer is not set");
                    }
                    const isGamerMe = ctx.room.roomState.myGamerId === currentPlayer.gamerId;
                    const rawWord = currentPlayer.text;
                    const word = rawWord.toLowerCase().replace(/[^a-z'-]/gi, "");

                    const currentPrompt = ctx.room.roomState.gameData!.round.prompt;

                    const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                    const allPlayerScores = roomMetadata.scoresByGamerId;
                    if (allPlayerScores === undefined) {
                        roomMetadata.scoresByGamerId = {};
                    }
                    if (allPlayerScores[currentPlayer.gamerId] === undefined) {
                        BirdBotUtils.initializeScoresForPlayerId(roomMetadata, currentPlayer.gamerId);
                    }
                    const playerScores = allPlayerScores[currentPlayer.gamerId]!;
                    const isLifeGain = previousHandlersCtx.isLifeGain as boolean | undefined;
                    const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
                    const currentRoomLanguage = BirdBotUtils.getCurrentRoomLanguage(ctx);
                    const submitIsInDictionary = currentDictionaryResource.resource.includes(word);
                    if (result === "success") {
                        let showWord = false;
                        const turnComments = [];

                        // Flips score
                        if (isLifeGain) {
                            const oldFlips = playerScores.flips;
                            playerScores.flips++;
                            roomMetadata.globalScores.flips++;
                            const newFlips = playerScores.flips;
                            const passedMilestone = BirdBotUtils.passedMilestone(oldFlips, newFlips, 4);
                            if (passedMilestone) {
                                turnComments.push(
                                    t("eventHandler.submit.comments.gainedLives", {
                                        count: newFlips,
                                        playerTotal: playerScores.flips,
                                        globalTotal: roomMetadata.globalScores.flips,
                                        lng: l(ctx),
                                    })
                                );
                            }
                        }

                        // Words score
                        playerScores.words++;

                        // Words without death score
                        playerScores.currentWordsWithoutDeath++;
                        if (playerScores.currentWordsWithoutDeath > playerScores.maxWordsWithoutDeath) {
                            const oldMaxWordsWithoutDeath = playerScores.maxWordsWithoutDeath;
                            playerScores.maxWordsWithoutDeath = playerScores.currentWordsWithoutDeath;
                            const newMaxWordsWithoutDeath = playerScores.maxWordsWithoutDeath;
                            const passedMilestone = BirdBotUtils.passedMilestone(
                                oldMaxWordsWithoutDeath,
                                newMaxWordsWithoutDeath,
                                50
                            );
                            if (passedMilestone) {
                                turnComments.push(
                                    t("eventHandler.submit.comments.reachedWordsNoDeath", {
                                        count: newMaxWordsWithoutDeath,
                                        lng: l(ctx),
                                    })
                                );
                            }
                        }

                        // More than 20 letters score
                        if (word.length >= 20) {
                            playerScores.moreThan20LettersWords++;
                            roomMetadata.globalScores.moreThan20LettersWords++;
                            turnComments.push(
                                t("eventHandler.submit.comments.placedLongWord", {
                                    playerTotal: playerScores.moreThan20LettersWords,
                                    globalTotal: roomMetadata.globalScores.moreThan20LettersWords,
                                    lng: l(ctx),
                                })
                            );
                            showWord = true;
                        }

                        // Hyphens score
                        if (word.includes("-")) {
                            playerScores.hyphenWords++;
                            roomMetadata.globalScores.hyphenWords++;
                            turnComments.push(
                                t("eventHandler.submit.comments.placedHyphenatedWord", {
                                    playerTotal: playerScores.hyphenWords,
                                    globalTotal: roomMetadata.globalScores.hyphenWords,
                                    lng: l(ctx),
                                })
                            );
                            showWord = true;
                        }

                        // Alpha score
                        const currentPlayerAlphaScore = playerScores.alpha;
                        const currentPlayerAlphaLetter = String.fromCharCode(65 + (currentPlayerAlphaScore % 26)).toLowerCase();
                        if (word[0] === currentPlayerAlphaLetter) {
                            const oldAlpha = playerScores.alpha;
                            playerScores.alpha++;
                            const newAlpha = playerScores.alpha;
                            const passedMilestone = BirdBotUtils.passedMilestone(oldAlpha, newAlpha, 26);
                            if (passedMilestone) {
                                turnComments.push(
                                    t("eventHandler.submit.comments.completedAlpha", {
                                        alphaString: recordsUtils.alpha.format(newAlpha),
                                        lng: l(ctx),
                                    })
                                );
                            }
                        }

                        // Previous syllables score
                        if (playerScores.previousSyllable) {
                            const previousSyllable = playerScores.previousSyllable;
                            const currentWordIncludesPreviousSyllable = word.includes(previousSyllable);
                            if (currentWordIncludesPreviousSyllable) {
                                playerScores.previousSyllableScore++;
                                roomMetadata.globalScores.previousSyllables++;
                                turnComments.push(
                                    t("eventHandler.submit.comments.placedPreviousSyllable", {
                                        syllable: previousSyllable.toUpperCase(),
                                        playerTotal: playerScores.previousSyllableScore,
                                        globalTotal: roomMetadata.globalScores.previousSyllables,
                                        lng: l(ctx),
                                    })
                                );
                                showWord = true;
                            }
                        }

                        // Multi syllables score
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
                                })
                            );
                            showWord = true;
                        }

                        // Depleted syllables score

                        const depletedSyllables = [];
                        if (currentDictionaryResource.resource.includes(word)) {
                            const splitWord = BirdBotUtils.splitWordIntoSyllables(word);
                            for (const syllable in splitWord) {
                                if (roomMetadata.remainingSyllables[syllable] !== undefined) {
                                    if (roomMetadata.remainingSyllables[syllable] > 0) {
                                        if (roomMetadata.remainingSyllables[syllable] - splitWord[syllable] >= 0) {
                                            roomMetadata.remainingSyllables[syllable] -= splitWord[syllable];
                                            if (roomMetadata.remainingSyllables[syllable] === 0) {
                                                depletedSyllables.push(syllable);
                                            }
                                        } else {
                                            Logger.error({
                                                message: `The word ${word} would over-deplete the syllable ${syllable}. This should never happen.`,
                                                path: "BirdBotEventHandlers.ts",
                                            });
                                        }
                                    } else {
                                        Logger.error({
                                            message: `Syllable ${syllable} already is depleted. This should never happen.`,
                                            path: "BirdBotEventHandlers.ts",
                                        });
                                    }
                                } else {
                                    Logger.error({
                                        message: `Syllable ${syllable} not found in remaining syllables. This should never happen.`,
                                        path: "BirdBotEventHandlers.ts",
                                    });
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
                                })
                            );
                        }

                        // Listed records
                        {
                            const listedRecordsInLanguage = listedRecordsPerLanguage[currentRoomLanguage];

                            for (const record of listedRecordsInLanguage) {
                                const resource = ctx.bot.getResource<ListedRecordListResource>(
                                    `list-${record}-${currentRoomLanguage}`
                                );
                                const recordScoreKey = scoreKeyPerListedRecord[record];
                                if (resource.resource.includes(word)) {
                                    playerScores[recordScoreKey]++;
                                    roomMetadata.globalScores[recordScoreKey]++;
                                    showWord = true;
                                    turnComments.push(
                                        t("eventHandler.submit.comments.listedRecord", {
                                            commentIntroduction: t(
                                                `eventHandler.submit.listedRecordCommentIntroductions.${record}`,
                                                {
                                                    lng: l(ctx),
                                                }
                                            ),
                                            playerTotal: playerScores[recordScoreKey],
                                            globalTotal: roomMetadata.globalScores[recordScoreKey],
                                            lng: l(ctx),
                                        })
                                    );
                                }
                            }
                        }

                        if (turnComments.length > 0 && !isGamerMe) {
                            if (showWord) {
                                ctx.utils.sendChatMessage(
                                    t("eventHandler.submit.turnCommentWithWord", {
                                        username: currentGamer.identity.nickname,
                                        word: word.toUpperCase(),
                                        comments: turnComments.join(" - "),
                                        lng: l(ctx),
                                    })
                                );
                            } else {
                                ctx.utils.sendChatMessage(
                                    t("eventHandler.submit.turnCommentWithoutWord", {
                                        username: currentGamer.identity.nickname,
                                        comments: turnComments.join(" - "),
                                        lng: l(ctx),
                                    })
                                );
                            }
                        }
                        if (!submitIsInDictionary) {
                            if (isGamerMe) {
                                // Add word to dictionary
                                if (!currentDictionaryResource.resource.includes(word)) {
                                    ctx.utils.sendChatMessage(`Unknown word ${word} is valid and was added to the dictionary.`);
                                    BirdBotUtils.handleWordAdditionToDictionaryResource(ctx, currentRoomLanguage, word);
                                }
                                currentDictionaryResource.metadata.testWords =
                                    currentDictionaryResource.metadata.testWords.filter((testWord) => testWord.word !== word);
                            } else {
                                // Queue word in test list for potential addition to dictionary
                                if (!currentDictionaryResource.metadata.testWords.some((testWord) => testWord.word === word)) {
                                    currentDictionaryResource.metadata.testWords.push({
                                        word,
                                        callbackRoomCode: ctx.room.constantRoomData.roomCode,
                                    });
                                    ctx.utils.sendChatMessage(`Unknown word ${word} is valid and was added to the test list.`);
                                }
                            }
                        }
                    } else {
                        const handleCommandResult = Utilitary.handleCommandIfExists(ctx, rawWord, currentGamer, birdbotCommands);
                        if (handleCommandResult === "command-not-found") {
                            ctx.utils.sendChatMessage(
                                t("eventHandler.chat.commandNotFound", {
                                    command: word,
                                    lng: l(ctx),
                                })
                            );
                        } else if (handleCommandResult === "not-room-creator") {
                            ctx.utils.sendChatMessage(
                                t("eventHandler.chat.notRoomCreator", {
                                    lng: l(ctx),
                                })
                            );
                        }
                        if (submitIsInDictionary) {
                            if (result === "invalidWord") {
                                if (isGamerMe) {
                                    // Remove word from dictionary
                                    const wordIndex = currentDictionaryResource.resource.indexOf(word);
                                    if (wordIndex !== -1) {
                                        ctx.utils.sendChatMessage(`Word ${word} is invalid and was removed from the dictionary.`);

                                        BirdBotUtils.handleWordRemovalFromDictionaryResource(
                                            ctx,
                                            currentRoomLanguage,
                                            wordIndex,
                                            word
                                        );
                                    }
                                    currentDictionaryResource.metadata.testWords =
                                        currentDictionaryResource.metadata.testWords.filter((testWord) => testWord.word !== word);
                                } else {
                                    // Queue word in test list for potential removal from dictionary
                                    if (
                                        !currentDictionaryResource.metadata.testWords.some((testWord) => testWord.word === word)
                                    ) {
                                        ctx.utils.sendChatMessage(
                                            `Word ${word} is invalid and was added to the test list for removal from the dictionary.`
                                        );
                                        currentDictionaryResource.metadata.testWords.push({
                                            word,
                                            callbackRoomCode: ctx.room.constantRoomData.roomCode,
                                        });
                                    }
                                }
                            }
                        }
                    }

                    if (currentGamer.identity.name && roomMetadata.gameMode !== "custom") {
                        BirdBotUtils.registerWord({
                            flip: isLifeGain ?? false,
                            word,
                            submitResult: result,
                            prompt: currentPrompt,
                            game: BirdBotUtils.getApiGameData(ctx),
                            player: BirdBotUtils.getApiPlayerData(currentGamer),
                        });
                    }
                },
            ],
            type: CommonTEH.type,
        },
    },
};

export default birdbotEventHandlers;
