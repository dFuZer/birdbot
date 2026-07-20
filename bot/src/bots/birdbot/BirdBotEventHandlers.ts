import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { CommonEventHandlers as CommonEH } from "../../lib/handlers/CommonEventHandlers.class";
import CommonTEH from "../../lib/handlers/DataTrackingEventHandlers.class";
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

function handleSuccessfulWord(ctx: Parameters<typeof BirdBotUtils.handleMyTurn>[0], previousHandlersCtx: Record<string, any>) {
    const playerPeerId = previousHandlersCtx.playerPeerId as number;
    const word = previousHandlersCtx.word as string;
    const isLifeGain = previousHandlersCtx.isLifeGain as boolean | undefined;

    const gameData = ctx.room.roomState.gameData!;
    if (gameData.milestone.name !== "round") return;

    const currentPrompt = gameData.milestone.syllable;
    const currentChatter = ctx.room.roomState.roomData!.chatters.find((c) => c.peerId === playerPeerId);
    if (!currentChatter) {
        throw new Error("Current chatter is not set");
    }
    const isMe = ctx.room.roomState.myPeerId === playerPeerId;
    const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
    if (roomMetadata.scoresByPeerId[playerPeerId] === undefined) {
        BirdBotUtils.initializeScoresForPlayerId(roomMetadata, playerPeerId);
    }
    const playerScores = roomMetadata.scoresByPeerId[playerPeerId]!;
    const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
    const currentRoomLanguage = BirdBotUtils.getCurrentRoomLanguage(ctx);
    const submitIsInDictionary = currentDictionaryResource.resource.includes(word);

    let showWord = false;
    const turnComments: string[] = [];

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

    playerScores.words++;
    playerScores.currentWordsWithoutDeath++;
    if (playerScores.currentWordsWithoutDeath > playerScores.maxWordsWithoutDeath) {
        const oldMax = playerScores.maxWordsWithoutDeath;
        playerScores.maxWordsWithoutDeath = playerScores.currentWordsWithoutDeath;
        const passedMilestone = BirdBotUtils.passedMilestone(oldMax, playerScores.maxWordsWithoutDeath, 50);
        if (passedMilestone) {
            turnComments.push(
                t("eventHandler.submit.comments.reachedWordsNoDeath", {
                    count: playerScores.maxWordsWithoutDeath,
                    lng: l(ctx),
                })
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
            })
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
            })
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
                })
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
                })
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
            })
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
            })
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
                    })
                );
            }
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
                })
            );
        } else {
            ctx.utils.sendChatMessage(
                t("eventHandler.submit.turnCommentWithoutWord", {
                    username: currentChatter.nickname,
                    comments: turnComments.join(" - "),
                    lng: l(ctx),
                })
            );
        }
    }

    if (!submitIsInDictionary) {
        if (isMe) {
            if (!currentDictionaryResource.resource.includes(word)) {
                ctx.utils.sendChatMessage(`Unknown word ${word} is valid and was added to the dictionary.`);
                BirdBotUtils.handleWordAdditionToDictionaryResource(ctx, currentRoomLanguage, word);
            }
            currentDictionaryResource.metadata.testWords = currentDictionaryResource.metadata.testWords.filter(
                (testWord) => testWord.word !== word
            );
        } else if (!currentDictionaryResource.metadata.testWords.some((testWord) => testWord.word === word)) {
            currentDictionaryResource.metadata.testWords.push({
                word,
                callbackRoomCode: ctx.room.constantRoomData.roomCode,
            });
            ctx.utils.sendChatMessage(`Unknown word ${word} is valid and was added to the test list.`);
        }
    }

    if (currentChatter.authId && roomMetadata.gameMode !== "custom") {
        BirdBotUtils.registerWord({
            flip: isLifeGain ?? false,
            word,
            submitResult: "success",
            prompt: currentPrompt,
            game: BirdBotUtils.getApiGameData(ctx),
            player: BirdBotUtils.getApiPlayerData(currentChatter),
        });
    }
}

const birdbotEventHandlers: BotEventHandlers = {
    chatDisconnect: [CommonEH.chatDisconnect, CommonEH.attemptToReconnectOnDisconnect],
    gameDisconnect: [CommonEH.gameDisconnect, CommonEH.attemptToReconnectOnDisconnect],
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

            const handleCommandResult = Utilitary.handleCommandIfExists(ctx, rawMessage, chatter, birdbotCommands);
            if (handleCommandResult === "command-not-found") {
                ctx.utils.sendChatMessage(
                    t("eventHandler.chat.commandNotFound", {
                        command: rawMessage,
                        lng: l(ctx),
                    })
                );
            } else if (handleCommandResult === "not-room-creator") {
                ctx.utils.sendChatMessage(t("eventHandler.chat.notRoomCreator", { lng: l(ctx) }));
            } else if (handleCommandResult === "not-admin") {
                ctx.utils.sendChatMessage(t("eventHandler.chat.notAdmin", { lng: l(ctx) }));
            }
        },
        chatterAdded: [
            CommonTEH.chatterAdded,
            (ctx, previousHandlersCtx) => {
                const newPeerId = previousHandlersCtx.newPeerId as number;
                const roomOwner = ctx.room.constantRoomData.roomCreatorAuthId;
                if (roomOwner) {
                    const roomOwnerChatter = ctx.room.roomState.roomData!.chatters.find((c) => c.authId === roomOwner);
                    if (roomOwnerChatter && !roomOwnerChatter.isModerator) {
                        ctx.utils.setUserModerator(roomOwnerChatter.peerId, true);
                        roomOwnerChatter.isModerator = true;
                    }
                }

                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                if (roomMetadata.wasInitialized && !roomMetadata.greetedPeerIds.has(newPeerId.toString())) {
                    roomMetadata.greetedPeerIds.add(newPeerId.toString());
                    ctx.utils.sendChatMessage(t("general.greet", { lng: l(ctx) }));
                }
            },
        ],
        chatterRemoved: CommonTEH.chatterRemoved,
    },
    game: {
        setup: [
            CommonTEH.setup,
            (ctx, previousHandlersCtx) => {
                const selfPeerId = previousHandlersCtx.selfPeerId as number;
                const leaderPeerId = previousHandlersCtx.leaderPeerId as number;
                const isFirstSetup = previousHandlersCtx.isFirstSetup as boolean;

                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                if (!roomMetadata.wasInitialized) {
                    BirdBotUtils.setupRoomMetadata(ctx);
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
                        BirdBotUtils.handleMyTurn(ctx, {});
                    }
                }
            },
        ],
        setMilestone: [
            CommonTEH.setMilestone,
            (ctx, previousHandlersCtx) => {
                if (previousHandlersCtx.roundEnded) {
                    ctx.utils.joinRound();
                    BirdBotUtils.resetRoomMetadata(ctx);
                }
                if (previousHandlersCtx.roundStarted) {
                    const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                    const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
                    roomMetadata.remainingSyllables = Object.assign({}, currentDictionaryResource.metadata.syllablesCount);
                    BirdBotUtils.initializeScoresForAllPlayers(ctx);

                    if (birdbotSupportedDictionaryIds.includes(ctx.room.roomState.gameData!.rules.dictionaryId as any)) {
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
        bonusAlphabetCompleted: CommonTEH.bonusAlphabetCompleted,
        setPlayerWord: CommonTEH.setPlayerWord,
        correctWord: [
            CommonTEH.correctWord,
            BirdBotUtils.handleMyTurn,
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
                const rawWord = state.word;
                const word = rawWord.toLowerCase().replace(/[^a-z'-]/gi, "");
                const isMe = ctx.room.roomState.myPeerId === playerPeerId;
                const currentChatter = ctx.room.roomState.roomData!.chatters.find((c) => c.peerId === playerPeerId);
                if (!currentChatter) return;

                const currentDictionaryResource = BirdBotUtils.getCurrentDictionaryResource(ctx);
                const currentRoomLanguage = BirdBotUtils.getCurrentRoomLanguage(ctx);
                const submitIsInDictionary = currentDictionaryResource.resource.includes(word);

                if (!isMe) {
                    const handleCommandResult = Utilitary.handleCommandIfExists(ctx, rawWord, currentChatter, birdbotCommands);
                    if (handleCommandResult === "command-not-found" && ["!", "/", "."].includes(rawWord.trim()[0] ?? "")) {
                        ctx.utils.sendChatMessage(
                            t("eventHandler.chat.commandNotFound", {
                                command: word,
                                lng: l(ctx),
                            })
                        );
                    } else if (handleCommandResult === "not-room-creator") {
                        ctx.utils.sendChatMessage(t("eventHandler.chat.notRoomCreator", { lng: l(ctx) }));
                    }
                }

                if (submitIsInDictionary && reason === "notInDictionary") {
                    if (isMe) {
                        const wordIndex = currentDictionaryResource.resource.indexOf(word);
                        if (wordIndex !== -1) {
                            ctx.utils.sendChatMessage(`Word ${word} is invalid and was removed from the dictionary.`);
                            BirdBotUtils.handleWordRemovalFromDictionaryResource(ctx, currentRoomLanguage, wordIndex, word);
                        }
                        currentDictionaryResource.metadata.testWords = currentDictionaryResource.metadata.testWords.filter(
                            (testWord) => testWord.word !== word
                        );
                    } else if (!currentDictionaryResource.metadata.testWords.some((testWord) => testWord.word === word)) {
                        ctx.utils.sendChatMessage(
                            `Word ${word} is invalid and was added to the test list for removal from the dictionary.`
                        );
                        currentDictionaryResource.metadata.testWords.push({
                            word,
                            callbackRoomCode: ctx.room.constantRoomData.roomCode,
                        });
                    }
                }

                if (currentChatter.authId && (ctx.room.roomState.metadata as BirdBotRoomMetadata).gameMode !== "custom") {
                    BirdBotUtils.registerWord({
                        flip: false,
                        word,
                        submitResult: "invalidWord",
                        prompt: gameData.milestone.syllable,
                        game: BirdBotUtils.getApiGameData(ctx),
                        player: BirdBotUtils.getApiPlayerData(currentChatter),
                    });
                }

                if (isMe) {
                    BirdBotUtils.handleMyTurn(ctx, {});
                }
            },
        ],
    },
};

export default birdbotEventHandlers;
