import Utilitary from "../class/Utilitary.class";
import { resultPoints } from "../constants/gameConstants";
import * as CrocoTypes from "../types/gameTypes";
import type { BotEventHandlerFn } from "../types/libEventTypes";

export default class CommonPlayerDataTrackingEventHandlers {
    public static helloOk: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readHelloOkMessageData(ctx.message);
        const { myGamerId, roomData, gameData } = data;

        ctx.room.roomState.roomData = roomData;
        ctx.room.roomState.gameData = gameData;
        ctx.room.roomState.currentTurnIndex = gameData.round.turnIndex;
        ctx.room.roomState.myGamerId = myGamerId;
    };

    public static setRoomAccessMode: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readSetRoomAccessModeData(ctx.message);
        const { roomAccessMode } = data;

        ctx.room.roomState.roomData!.access.mode = roomAccessMode as CrocoTypes.RoomAccessMode;
    };

    public static setRole: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readSetRoleData(ctx.message);
        const { gamerId, role } = data;

        const roomData = ctx.room.roomState.roomData!;

        if (role === "host") {
            const currentHost = roomData.gamers.find((gamer) => gamer.role === "host");
            if (currentHost) {
                currentHost.role = "";
            }

            const newHost = roomData.gamers.find((gamer) => gamer.id === gamerId);
            if (newHost) {
                newHost.role = "host";
            }
        }
        const gamer = roomData.gamers.find((gamer) => gamer.id === gamerId);
        if (gamer) {
            gamer.role = role as CrocoTypes.RoomRole;
        }
    };

    public static addGamer: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readAddGamerData(ctx.message);
        const { newPlayerData } = data;

        ctx.room.roomState.roomData!.gamers.push(newPlayerData);
    };

    public static setGamerOnline: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readSetGamerOnlineData(ctx.message);
        const { gamerId, online, playerData } = data;

        const roomData = ctx.room.roomState.roomData!;
        const gamer = roomData.gamers.find((y) => y.id === gamerId);

        if (gamer) {
            gamer.isOnline = online;
            if (online && playerData) {
                gamer.identity = playerData;
            }
        }
    };

    public static setup: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const isInitialSetup = ctx.room.roomState.gameData!.step.value === "initialSetup";
        const data = ctx.bot.networkAdapter.readSetupData(ctx.message, isInitialSetup);

        if (isInitialSetup) {
            previousHandlersCtx.initialSetup = true;
            if (data.initialSetup) {
                const { gameMode, dictionaryId, dictionaryManifest } = data;

                ctx.room.roomState.gameData!.rules.gameMode = gameMode;
                ctx.room.roomState.gameData!.rules.dictionaryId = dictionaryId;
                ctx.room.roomState.gameData!.dictionaryManifest = dictionaryManifest;
                ctx.room.roomState.gameData!.step = {
                    value: "pregame",
                    timestamp: data.timestamp,
                };
            }
        } else {
            if (!data.initialSetup) {
                const { rule, value } = data;

                if (rule === "gameMode") {
                    ctx.room.roomState.gameData!.rules.gameMode = value;
                } else if (rule === "dictionaryId") {
                    ctx.room.roomState.gameData!.rules.dictionaryId = value.dictionaryId;
                    ctx.room.roomState.gameData!.dictionaryManifest = value.dictionaryManifest;
                } else if (rule === "promptDifficulty") {
                    ctx.room.roomState.gameData!.rules.promptDifficulty = value;
                } else if (rule === "customPromptDifficulty") {
                    ctx.room.roomState.gameData!.rules.customPromptDifficulty = value;
                } else if (rule === "bombDuration") {
                    ctx.room.roomState.gameData!.rules.bombDuration = value;
                } else if (rule === "roundsToWin") {
                    ctx.room.roomState.gameData!.rules.roundsToWin = value;
                } else if (rule === "scoreGoal") {
                    ctx.room.roomState.gameData!.rules.scoreGoal = value;
                } else if (rule === "startingLives") {
                    ctx.room.roomState.gameData!.rules.startingLives = value;
                } else if (rule === "maxLives") {
                    ctx.room.roomState.gameData!.rules.maxLives = value;
                } else if (rule === "minWordLengthOption") {
                    ctx.room.roomState.gameData!.rules.minWordLengthOption = value;
                }
            }
        }
    };

    public static toggleCountdown: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readToggleCountdownData(ctx.message);
        const { enabled, timestamp } = data;

        ctx.room.roomState.gameData!.countdown.enabled = enabled;
        ctx.room.roomState.gameData!.countdown.timestamp = enabled ? timestamp : null;
    };

    public static removePlayer: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readRemovePlayerData(ctx.message);
        const { removedGamerId } = data;

        const gameData = ctx.room.roomState.gameData!;
        gameData.players = gameData.players.filter((player) => player.gamerId !== removedGamerId);
    };

    public static addPlayer: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readAddPlayerData(ctx.message);
        const { playerData } = data;

        ctx.room.roomState.gameData!.players.push(playerData);
    };

    public static oneVOneAnnouncement: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readOneVOneAnnouncementData(ctx.message);

        ctx.room.roomState.gameData!.step = {
            value: "1v1Announcement",
            timestamp: data.timestamp,
        };
    };

    public static roundIntro: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readRoundIntroData(ctx.message);
        const { startPlayerIndex, timestamp } = data;

        const gameData = ctx.room.roomState.gameData!;

        if (gameData.round.index === 0) {
            gameData.countdown.timestamp = null;
        }

        gameData.step = {
            value: "roundIntro",
            timestamp: timestamp,
        };

        gameData.round.turnIndex = -1;
        ctx.room.roomState.currentTurnIndex = -1;
        gameData.round.startPlayerIndex = startPlayerIndex;
        gameData.round.wordsPlayed = 0;

        for (const gamer of gameData.players) {
            gamer.lastPrompt = "";
            gamer.lastSubmit = null;
            gamer.text = "";
            gamer.lives = gameData.rules.startingLives;
            gamer.points = 0;
            gamer.usedLetters = "";
        }
    };

    public static round: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readRoundData(ctx.message);
        const { prompt, minWordLength, timestamp } = data;

        const gameData = ctx.room.roomState.gameData!;

        gameData.step = {
            value: "round",
            timestamp: timestamp,
        };
        gameData.round.turnIndex = 0;
        ctx.room.roomState.currentTurnIndex = gameData.players.length - 1;
        gameData.round.state = {
            value: "bombTicking",
            timestamp: timestamp,
        };
        gameData.round.prompt = prompt;
        gameData.round.minWordLength = minWordLength;
        gameData.round.promptAge = 0;
        gameData.round.startTimestamp = timestamp;
        gameData.round.wordsPlayed = 0;
        const startPlayer = gameData.players[gameData.round.startPlayerIndex]!;
        startPlayer.lastPrompt = prompt;
        startPlayer.lastSubmit = null;
    };

    public static roundOver: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readRoundOverData(ctx.message);
        const { lastRoundWinnerId, timestamp } = data;

        const gameData = ctx.room.roomState.gameData!;
        for (const d of gameData.players)
            if (d.justExploded) {
                d.lives--;
                d.justExploded = false;
            }
        gameData.step = {
            value: "roundOver",
            timestamp: timestamp,
        };
        gameData.round.index++;
        gameData.game.duration += timestamp - gameData.round.startTimestamp;
        gameData.game.wordsPlayed += gameData.round.wordsPlayed;
        gameData.lastRoundWinnerId = lastRoundWinnerId;
    };

    public static explodeBomb: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readExplodeBombData(ctx.message);

        const gameData = ctx.room.roomState.gameData!;
        const currentPlayer = Utilitary.getCurrentPlayer(ctx.room.roomState.gameData!);
        if (!currentPlayer) {
            throw new Error("Current player is not set");
        }
        currentPlayer.justExploded = true;
        currentPlayer.points = Math.max(0, currentPlayer.points + resultPoints.bombExploded);
        currentPlayer.lastSubmit = {
            timestamp: data.timestamp,
            result: "bombExploded",
            points: resultPoints.bombExploded,
        };
        gameData.round.state = {
            value: "bombExploded",
            timestamp: data.timestamp,
        };
    };

    public static nextTurn: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const data = ctx.bot.networkAdapter.readNextTurnData(ctx.message);
        const { prompt, promptAge, minWordLength, timestamp } = data;

        const gameData = ctx.room.roomState.gameData!;
        ctx.room.roomState.currentTurnIndex = gameData.round.turnIndex;
        let currentPlayer;
        previousHandlersCtx.previousGamerId = gameData.players[gameData.round.turnIndex]!.gamerId;
        previousHandlersCtx.previousPrompt = gameData.round.prompt;

        do {
            gameData.round.turnIndex = (gameData.round.turnIndex + 1) % gameData.players.length;
            currentPlayer = gameData.players[gameData.round.turnIndex]!;
        } while (currentPlayer.lives <= 0);

        ctx.room.roomState.currentTurnIndex = gameData.round.turnIndex;

        gameData.round.prompt = prompt;
        gameData.round.promptAge = promptAge;
        gameData.round.minWordLength = minWordLength;
        currentPlayer.lastPrompt = gameData.round.prompt;
    };

    public static submit: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const data = ctx.bot.networkAdapter.readSubmitData(ctx.message);
        const { result, points, timestamp } = data;

        const currentPlayer = Utilitary.getCurrentPlayer(ctx.room.roomState.gameData!);
        if (!currentPlayer) {
            throw new Error("Current player is not set");
        }
        const gameData = ctx.room.roomState.gameData!;

        currentPlayer.points = Math.max(0, currentPlayer.points + points);
        currentPlayer.lastSubmit = {
            points,
            result: result as CrocoTypes.SubmitResultType,
            timestamp: timestamp,
        };
        if (result === "success") {
            gameData.round.wordsPlayed++;
            ctx.room.roomState.wordHistory.push(currentPlayer.text);
            let currentUsedLetters = currentPlayer.usedLetters;
            for (const letter of currentPlayer.text) {
                if (!currentUsedLetters.includes(letter) && gameData.dictionaryManifest.bonusLetters.includes(letter)) {
                    currentUsedLetters += letter;
                }
            }
            currentPlayer.usedLetters = currentUsedLetters;
            const isLifeGain = gameData.dictionaryManifest.bonusLetters.length === currentUsedLetters.length;
            if (isLifeGain) {
                previousHandlersCtx.isLifeGain = true;
                currentPlayer.lives = Math.min(gameData.rules.maxLives, currentPlayer.lives + 1);
                currentPlayer.usedLetters = "";
            }
        }
    };

    public static type: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readTypeData(ctx.message);
        const { typedWord } = data;

        const currentPlayer = Utilitary.getCurrentPlayer(ctx.room.roomState.gameData!);
        if (!currentPlayer) {
            throw new Error("Current player is not set");
        }
        currentPlayer.text = typedWord;
    };

    public static gameOver: BotEventHandlerFn = (ctx) => {
        const data = ctx.bot.networkAdapter.readGameOverData(ctx.message);
        const { gameOverData, shouldResetPlayers, timestamp } = data;

        const roomData = ctx.room.roomState.roomData!;
        const gameData = ctx.room.roomState.gameData!;
        if (roomData.access.mode === "playlist") {
            if (roomData.access.playlistType === "ranked1v1") {
                gameData.step = {
                    value: "matchOver",
                    timestamp: timestamp,
                };
            }
        } else {
            gameData.step = {
                value: "pregame",
                timestamp: timestamp,
            };
            gameData.round = {
                index: 0,
                startPlayerIndex: 0,
                turnIndex: 0,
                state: {
                    value: "bombTicking",
                    timestamp: 0,
                },
                prompt: "",
                promptAge: 0,
                minWordLength: 0,
                startTimestamp: 0,
                wordsPlayed: 0,
            };
            if (shouldResetPlayers) {
                gameData.players.length = 0;
            }
            for (const gamer of roomData.gamers) gamer.roundsWon = 0;
            for (const player of gameData.players) Utilitary.resetPlayer(player);
        }
        gameData.game = {
            duration: 0,
            wordsPlayed: 0,
        };
    };

    public static updatePlaylistRatings: BotEventHandlerFn = (ctx) => {
        ctx.bot.networkAdapter.readUpdatePlaylistRatingsData(ctx.message);
    };
}
