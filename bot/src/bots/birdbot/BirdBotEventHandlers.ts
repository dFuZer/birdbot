import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { CommonEventHandlers as CommonEH } from "../../lib/handlers/CommonEventHandlers.class";
import CommonTEH from "../../lib/handlers/DataTrackingEventHandlers.class";
import type { BotEventHandlers } from "../../lib/types/libEventTypes";
import { birdbotCommands } from "./BirdBotCommands";
import { birdbotSupportedDictionaryIds, defaultBirdBotBombPartyRules, recordsUtils } from "./BirdBotConstants";
import type { BirdBotRoomMetadata } from "./BirdBotTypes";
import BirdBotUtils from "./BirdBotUtils.class";

const birdbotEventHandlers: BotEventHandlers = {
    open: CommonEH.open,
    close: [CommonEH.close, CommonEH.attemptToReconnectOnClose],
    message: {
        "hello": CommonEH.hello,
        "getGamerModerationInfo": CommonEH.getGamerModerationInfo,
        "bye": CommonEH.bye,
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
        "setRoomAccessMode": CommonTEH.setRoomAccessMode,
        "setRole": CommonTEH.setRole,
        "addGamer": CommonTEH.addGamer,
        "setGamerOnline": CommonTEH.setGamerOnline,
        "chat": (ctx) => {
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
            const gamerAccountName = gamer.identity.name;
            const handleCommandResult = Utilitary.handleCommandIfExists(
                ctx,
                rawMessage,
                gamerAccountName,
                birdbotCommands
            );
            if (handleCommandResult === "command-not-found") {
                ctx.utils.sendChatMessage(`Command not found: ${rawMessage}`);
            } else if (handleCommandResult === "not-room-creator") {
                ctx.utils.sendChatMessage(
                    `You cannot use this command if you are not the room creator. /b to create your room will be available soon.`
                );
            }
        },
        "chatRateLimited": CommonEH.chatRateLimited,
        "getGamerModerationInfo.result": CommonEH.getGamerModerationInfoResult,
        "announce": CommonEH.announce,
        "announceRestart": CommonEH.announceRestart,
        "session": {
            "debug": CommonEH.debug,
            "start": CommonEH.start,
            "abort": CommonEH.abort,
            "setup": [
                CommonTEH.setup,
                (ctx, previousHandlersCtx) => {
                    const isInitialSetup = previousHandlersCtx.initialSetup as true | undefined;
                    if (isInitialSetup) {
                        Logger.log({
                            message: "This is the initial setup, setting rules to default values.",
                            path: "BirdBotEventHandlers.ts",
                        });
                        BirdBotUtils.setRoomGameMode(ctx, defaultBirdBotBombPartyRules);
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
            "toggleCountdown": CommonTEH.toggleCountdown,
            "addPlayer": CommonTEH.addPlayer,
            "removePlayer": CommonTEH.removePlayer,
            "1v1Announcement": CommonTEH.oneVOneAnnouncement,
            "roundIntro": CommonTEH.roundIntro,
            "round": [
                CommonTEH.round,
                (ctx) => {
                    const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                    const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
                    const currentDictionarySyllablesCount = currentDictionaryResource.metadata.syllablesCount;
                    const clonedSyllablesCount = Object.assign({}, currentDictionarySyllablesCount);
                    roomMetadata.remainingSyllables = clonedSyllablesCount;
                    BirdBotUtils.initializeScoresForAllPlayers(ctx);

                    if (
                        birdbotSupportedDictionaryIds.includes(ctx.room.roomState.gameData!.rules.dictionaryId as any)
                    ) {
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
            "roundOver": [
                CommonTEH.roundOver,
                (ctx, previousHandlersCtx) => {
                    const deadPlayerIds = previousHandlersCtx.deadPlayerIds as number[];
                    for (const deadPlayerId of deadPlayerIds) {
                        BirdBotUtils.handlePlayerDeath(ctx, deadPlayerId);
                    }
                },
            ],
            "gameOver": [
                CommonTEH.gameOver,
                (ctx) => {
                    const joinMessage = ctx.bot.networkAdapter.getJoinMessage();
                    ctx.room.ws!.send(joinMessage);
                    BirdBotUtils.resetRoomMetadata(ctx);
                },
            ],
            "updatePlaylistRatings": CommonEH.updatePlaylistRatings,
            "explodeBomb": [CommonTEH.explodeBomb],
            "nextTurn": [
                CommonTEH.nextTurn,
                BirdBotUtils.handleMyTurn,
                (ctx, previousHandlersCtx) => {
                    const previousGamerId = previousHandlersCtx.previousGamerId as number;
                    const previousPrompt = previousHandlersCtx.previousPrompt as string;
                    const deadPlayerIds = previousHandlersCtx.deadPlayerIds as number[];

                    for (const deadPlayerId of deadPlayerIds) {
                        BirdBotUtils.handlePlayerDeath(ctx, deadPlayerId);
                    }

                    const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                    const previousPlayerScores = roomMetadata.scoresByGamerId[previousGamerId];
                    if (previousPlayerScores === undefined) {
                        throw new Error("Previous player scores not found");
                    }
                    previousPlayerScores.previousSyllable = previousPrompt;
                },
            ],
            "submit": [
                CommonTEH.submit,
                (ctx, previousHandlersCtx) => {
                    const data = ctx.bot.networkAdapter.readSubmitData(ctx.message);
                    const { result, points } = data;

                    const currentPlayer = Utilitary.getCurrentPlayer(ctx.room.roomState.gameData!);
                    if (!currentPlayer) {
                        throw new Error("Current player is not set");
                    }
                    const currentGamer = ctx.room.roomState.roomData!.gamers.find(
                        (gamer) => gamer.id === currentPlayer.gamerId
                    );
                    if (!currentGamer) {
                        throw new Error("Current gamer is not set");
                    }
                    const word = currentPlayer.text;
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
                    if (result === "success") {
                        let showWord = false;
                        const turnComments = [];

                        // Flips score
                        if (isLifeGain) {
                            const oldFlips = playerScores.flips;
                            playerScores.flips++;
                            const newFlips = playerScores.flips;
                            const passedMilestone = BirdBotUtils.passedMilestone(oldFlips, newFlips, 4);
                            if (passedMilestone) {
                                turnComments.push(`gained ${newFlips} lives`);
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
                                turnComments.push(`reached ${newMaxWordsWithoutDeath} words without death`);
                            }
                        }

                        // More than 20 letters score
                        if (word.length > 20) {
                            playerScores.moreThan20LettersWords++;
                            turnComments.push(`placed a long word`);
                            showWord = true;
                        }

                        // Hyphens score
                        if (word.includes("-")) {
                            playerScores.hyphenWords++;
                            turnComments.push(`placed a hyphenated word`);
                            showWord = true;
                        }

                        // Alpha score
                        const currentPlayerAlphaScore = playerScores.alpha;
                        const currentPlayerAlphaLetter = String.fromCharCode(
                            65 + (currentPlayerAlphaScore % 26)
                        ).toLowerCase();
                        if (word[0] === currentPlayerAlphaLetter) {
                            const oldAlpha = playerScores.alpha;
                            playerScores.alpha++;
                            const newAlpha = playerScores.alpha;
                            const passedMilestone = BirdBotUtils.passedMilestone(oldAlpha, newAlpha, 26);
                            if (passedMilestone) {
                                turnComments.push(
                                    `completed an alpha: ${recordsUtils.alpha.specificScoreDisplayStringGenerator(
                                        newAlpha
                                    )}`
                                );
                            }
                        }

                        // Previous syllables score
                        if (playerScores.previousSyllable) {
                            const previousSyllable = playerScores.previousSyllable;
                            const currentWordIncludesPreviousSyllable = word.includes(previousSyllable);
                            if (currentWordIncludesPreviousSyllable) {
                                playerScores.previousSyllableScore++;
                                turnComments.push(`placed a previous syllable: ${previousSyllable.toUpperCase()}`);
                                showWord = true;
                            }
                        }

                        // Multi syllables score
                        const multiSyllableGainedPoints = word.split(currentPrompt).length - 2;
                        if (multiSyllableGainedPoints > 0) {
                            playerScores.multiSyllables += multiSyllableGainedPoints;
                            turnComments.push(
                                `gained ${multiSyllableGainedPoints} MS (${currentPrompt.toUpperCase()} x ${
                                    multiSyllableGainedPoints + 1
                                })`
                            );
                            showWord = true;
                        }

                        // Depleted syllables score
                        const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
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
                            turnComments.push(
                                `depleted ${depletedSyllables.length} syllables: ${depletedSyllables
                                    .join(", ")
                                    .toUpperCase()}`
                            );
                        }
                        if (turnComments.length > 0 && ctx.room.roomState.myGamerId !== currentPlayer.gamerId) {
                            if (showWord) {
                                ctx.utils.sendChatMessage(
                                    `${currentGamer.identity.nickname}: (${word.toUpperCase()}) ${turnComments.join(
                                        " - "
                                    )}.`
                                );
                            } else {
                                ctx.utils.sendChatMessage(
                                    `${currentGamer.identity.nickname}: ${turnComments.join(" - ")}.`
                                );
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
            "type": CommonTEH.type,
        },
    },
};

export default birdbotEventHandlers;
