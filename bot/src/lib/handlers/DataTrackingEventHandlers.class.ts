import Utilitary from "../class/Utilitary.class";
import { defaultBonusAlphabetsByDictionaryId } from "../constants/gameConstants";
import {
    bonusAlphabetToLetters,
    extractRulesValues,
    type DictionaryId,
    type GameData,
    type GameRules,
    type Milestone,
    type MilestoneRound,
    type PlayerState,
    type PromptDifficulty,
} from "../types/gameTypes";
import type { BotEventHandlerFn } from "../types/libEventTypes";

function normalizePlayerState(peerId: number | string, raw: any): PlayerState {
    return {
        peerId: Number(peerId),
        lives: raw.lives ?? 0,
        word: (raw.word ?? "").toString(),
        usedLetters: raw.usedLetters ?? "",
        bonusLetters: raw.bonusLetters,
        wasWordValidated: raw.wasWordValidated,
    };
}

function normalizeMilestone(raw: any, previous?: Milestone | null): Milestone {
    if (raw.name === "round") {
        const playerStatesByPeerId: Record<string, PlayerState> = {};
        const rawStates = raw.playerStatesByPeerId ?? {};
        for (const [id, state] of Object.entries(rawStates)) {
            const prev =
                previous?.name === "round" ? previous.playerStatesByPeerId[id]?.usedLetters : undefined;
            const normalized = normalizePlayerState(id, state);
            if (prev !== undefined && !normalized.usedLetters) {
                normalized.usedLetters = prev;
            }
            playerStatesByPeerId[id] = normalized;
        }
        return {
            name: "round",
            syllable: (raw.syllable ?? "").toString().toLowerCase(),
            promptAge: raw.promptAge,
            currentPlayerPeerId: raw.currentPlayerPeerId,
            playerStatesByPeerId,
            dictionaryManifest: raw.dictionaryManifest
                ? {
                      name: raw.dictionaryManifest.name,
                      bonusLetters: bonusAlphabetToLetters(
                          raw.dictionaryManifest.bonusAlphabet ?? raw.dictionaryManifest.bonusLetters
                      ),
                      promptDifficulties: raw.dictionaryManifest.promptDifficulties,
                  }
                : previous?.name === "round"
                  ? previous.dictionaryManifest
                  : undefined,
            startTimestamp:
                previous?.name === "round" && previous.startTimestamp
                    ? previous.startTimestamp
                    : Date.now(),
        };
    }
    return {
        name: "seating",
        rulesLocked: raw.rulesLocked,
        dictionaryManifest: raw.dictionaryManifest
            ? {
                  name: raw.dictionaryManifest.name,
                  bonusLetters: bonusAlphabetToLetters(
                      raw.dictionaryManifest.bonusAlphabet ?? raw.dictionaryManifest.bonusLetters
                  ),
                  promptDifficulties: raw.dictionaryManifest.promptDifficulties,
              }
            : undefined,
    };
}

function rulesFromSetup(rawRules: Record<string, { value: unknown }>): GameRules {
    const values = extractRulesValues(rawRules);
    const dictionaryId = (values.dictionaryId as DictionaryId) ?? "en";
    const customBonusAlphabet =
        values.customBonusAlphabet && typeof values.customBonusAlphabet === "object"
            ? (values.customBonusAlphabet as GameRules["customBonusAlphabet"])
            : undefined;
    return {
        dictionaryId,
        minTurnDuration: Number(values.minTurnDuration ?? 5),
        promptDifficulty: (values.promptDifficulty as PromptDifficulty) ?? "custom",
        customPromptDifficulty: Number(values.customPromptDifficulty ?? 1),
        maxPromptAge: Number(values.maxPromptAge ?? 16),
        startingLives: Number(values.startingLives ?? 2),
        maxLives: Number(values.maxLives ?? 3),
        customBonusAlphabet: customBonusAlphabet
            ? { ...customBonusAlphabet }
            : { ...defaultBonusAlphabetsByDictionaryId[dictionaryId] },
    };
}

export default class CommonPlayerDataTrackingEventHandlers {
    public static setup: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const data = ctx.message.args[0];
        const wasUninitialized = ctx.room.roomState.gameData === null;
        previousHandlersCtx.isFirstSetup = wasUninitialized;

        const rules = rulesFromSetup(data.rules);
        const milestone = normalizeMilestone(data.milestone, ctx.room.roomState.gameData?.milestone);
        const dictionaryManifest =
            milestone.dictionaryManifest ??
            (data.milestone?.dictionaryManifest
                ? {
                      name: data.milestone.dictionaryManifest.name,
                      bonusLetters: bonusAlphabetToLetters(
                          data.milestone.dictionaryManifest.bonusAlphabet ??
                              data.milestone.dictionaryManifest.bonusLetters
                      ),
                      promptDifficulties: data.milestone.dictionaryManifest.promptDifficulties,
                  }
                : { bonusLetters: "" });

        const players = (data.players ?? []).map((p: any) => ({
            profile: p.profile,
            isOnline: p.isOnline !== false,
        }));

        const gameData: GameData = {
            rules,
            dictionaryManifest,
            milestone,
            players,
            leaderPeerId: data.leaderPeerId,
            selfRoles: data.selfRoles ?? [],
        };

        if (rules.customBonusAlphabet) {
            const letters = bonusAlphabetToLetters(rules.customBonusAlphabet);
            gameData.dictionaryManifest.bonusLetters = letters;
            if (milestone.dictionaryManifest) {
                milestone.dictionaryManifest.bonusLetters = letters;
            }
        }

        ctx.room.roomState.gameData = gameData;
        ctx.room.roomState.myPeerId = data.selfPeerId ?? ctx.room.roomState.myPeerId;
        ctx.room.rawRoom.hasEverConnected = true;

        if (milestone.name === "round") {
            ctx.room.roomState.roundStartTimestamp = milestone.startTimestamp;
        }

        previousHandlersCtx.selfPeerId = data.selfPeerId;
        previousHandlersCtx.leaderPeerId = data.leaderPeerId;
    };

    public static setMilestone: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const newMilestoneRaw = ctx.message.args[0];
        const gameData = ctx.room.roomState.gameData!;
        const previousName = gameData.milestone.name;
        const milestone = normalizeMilestone(newMilestoneRaw, gameData.milestone);
        previousHandlersCtx.previousMilestoneName = previousName;
        previousHandlersCtx.newMilestoneName = milestone.name;

        if (previousName === "round" && milestone.name === "seating") {
            previousHandlersCtx.roundEnded = true;
            ctx.room.roomState.wordHistory.length = 0;
        }
        if (previousName === "seating" && milestone.name === "round") {
            previousHandlersCtx.roundStarted = true;
            (milestone as MilestoneRound).startTimestamp = Date.now();
            ctx.room.roomState.roundStartTimestamp = (milestone as MilestoneRound).startTimestamp;
        }

        gameData.milestone = milestone;
        if (milestone.dictionaryManifest) {
            gameData.dictionaryManifest = milestone.dictionaryManifest;
        }
    };

    public static setRules: BotEventHandlerFn = (ctx) => {
        const data = ctx.message.args[0];
        const gameData = ctx.room.roomState.gameData!;
        if (data && typeof data === "object") {
            for (const [key, value] of Object.entries(data)) {
                if (key in gameData.rules) {
                    (gameData.rules as any)[key] = value;
                }
            }
            if (data.customBonusAlphabet && typeof data.customBonusAlphabet === "object") {
                gameData.dictionaryManifest.bonusLetters = bonusAlphabetToLetters(data.customBonusAlphabet);
                if (gameData.milestone.dictionaryManifest) {
                    gameData.milestone.dictionaryManifest.bonusLetters = gameData.dictionaryManifest.bonusLetters;
                }
            }
        }
    };

    public static setDictionaryManifest: BotEventHandlerFn = (ctx) => {
        const manifest = ctx.message.args[0];
        const gameData = ctx.room.roomState.gameData!;
        gameData.dictionaryManifest = {
            name: manifest.name,
            bonusLetters: bonusAlphabetToLetters(manifest.bonusAlphabet ?? manifest.bonusLetters),
            promptDifficulties: manifest.promptDifficulties,
        };
        if (gameData.milestone.name === "round" || gameData.milestone.name === "seating") {
            gameData.milestone.dictionaryManifest = gameData.dictionaryManifest;
        }
    };

    public static addPlayer: BotEventHandlerFn = (ctx) => {
        const player = ctx.message.args[0];
        const gameData = ctx.room.roomState.gameData!;
        gameData.players.push({
            profile: player.profile,
            isOnline: player.isOnline !== false,
        });
    };

    public static updatePlayer: BotEventHandlerFn = (ctx) => {
        const playerPeerId = ctx.message.args[0];
        const profile = ctx.message.args[1];
        const isOnline = ctx.message.args[2];
        const gameData = ctx.room.roomState.gameData!;
        const player = gameData.players.find((p) => p.profile.peerId === playerPeerId);
        if (player) {
            if (profile) player.profile = profile;
            if (typeof isOnline === "boolean") player.isOnline = isOnline;
        }
        const chatter = ctx.room.roomState.roomData?.chatters.find((c) => c.peerId === playerPeerId);
        if (chatter) {
            if (profile) {
                chatter.nickname = profile.nickname ?? chatter.nickname;
                chatter.authId = profile.auth?.id ?? chatter.authId;
            }
            if (typeof isOnline === "boolean") chatter.isOnline = isOnline;
        }
    };

    public static removePlayer: BotEventHandlerFn = (ctx) => {
        const playerPeerId = ctx.message.args[0];
        const gameData = ctx.room.roomState.gameData!;
        gameData.players = gameData.players.filter((p) => p.profile.peerId !== playerPeerId);
    };

    public static clearUsedWords: BotEventHandlerFn = (ctx) => {
        ctx.room.roomState.wordHistory.length = 0;
    };

    public static nextTurn: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const playerPeerId = ctx.message.args[0];
        const syllable = (ctx.message.args[1] ?? "").toString().toLowerCase();
        const promptAge = ctx.message.args[2];
        const gameData = ctx.room.roomState.gameData!;
        if (gameData.milestone.name !== "round") return;

        previousHandlersCtx.previousPeerId = gameData.milestone.currentPlayerPeerId;
        previousHandlersCtx.previousPrompt = gameData.milestone.syllable;

        gameData.milestone.currentPlayerPeerId = playerPeerId;
        gameData.milestone.syllable = syllable;
        gameData.milestone.promptAge = promptAge;
        const state = gameData.milestone.playerStatesByPeerId[String(playerPeerId)];
        if (state) {
            state.word = "";
        }
    };

    public static livesLost: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const playerPeerId = ctx.message.args[0];
        const lives = ctx.message.args[1];
        const gameData = ctx.room.roomState.gameData!;
        if (gameData.milestone.name !== "round") return;
        const state = gameData.milestone.playerStatesByPeerId[String(playerPeerId)];
        if (state) {
            const previousLives = state.lives;
            state.lives = lives;
            state.usedLetters = "";
            previousHandlersCtx.lostLifePeerId = playerPeerId;
            if (previousLives > 0 && lives === 0) {
                previousHandlersCtx.deadPeerId = playerPeerId;
            }
        }
    };

    public static bonusAlphabetCompleted: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const playerPeerId = ctx.message.args[0];
        const lives = ctx.message.args[1];
        const gameData = ctx.room.roomState.gameData!;
        if (gameData.milestone.name !== "round") return;
        const state = gameData.milestone.playerStatesByPeerId[String(playerPeerId)];
        if (state) {
            state.lives = lives;
            state.usedLetters = "";
            previousHandlersCtx.isLifeGain = true;
            previousHandlersCtx.lifeGainPeerId = playerPeerId;
        }
    };

    public static setPlayerWord: BotEventHandlerFn = (ctx) => {
        const playerPeerId = ctx.message.args[0];
        const word = ctx.message.args[1] ?? "";
        const gameData = ctx.room.roomState.gameData!;
        if (gameData.milestone.name !== "round") return;
        const state = gameData.milestone.playerStatesByPeerId[String(playerPeerId)];
        if (state) {
            state.word = word.toString();
        }
    };

    public static failWord: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const playerPeerId = ctx.message.args[0];
        const reason = ctx.message.args[1];
        previousHandlersCtx.playerPeerId = playerPeerId;
        previousHandlersCtx.reason = reason;
        previousHandlersCtx.success = false;
    };

    public static correctWord: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const wordData = ctx.message.args[0] ?? {};
        const playerPeerId = wordData.playerPeerId ?? ctx.message.args[0];
        const gameData = ctx.room.roomState.gameData!;
        if (gameData.milestone.name !== "round") return;

        const state = gameData.milestone.playerStatesByPeerId[String(playerPeerId)];
        if (!state) return;

        const rawWord = state.word;
        const word = rawWord.toLowerCase().replace(/[^a-z'-]/gi, "");
        ctx.room.roomState.wordHistory.push(word);

        const bonusLetters = gameData.dictionaryManifest.bonusLetters;
        let used = state.usedLetters;
        for (const letter of word) {
            if (bonusLetters.includes(letter) && !used.includes(letter)) {
                used += letter;
            }
        }
        state.usedLetters = used;
        const isLifeGain = bonusLetters.length > 0 && used.length >= bonusLetters.length;
        if (isLifeGain) {
            previousHandlersCtx.isLifeGain = true;
            state.usedLetters = "";
        }

        previousHandlersCtx.playerPeerId = playerPeerId;
        previousHandlersCtx.word = word;
        previousHandlersCtx.rawWord = rawWord;
        previousHandlersCtx.success = true;
    };

    public static chatterAdded: BotEventHandlerFn = (ctx, previousHandlersCtx) => {
        const profile = ctx.message.args[0];
        const chatter = Utilitary.profileToChatter(profile);
        if (!ctx.room.roomState.roomData) {
            ctx.room.roomState.roomData = {
                code: ctx.room.constantRoomData.roomCode,
                isPublic: ctx.room.constantRoomData.targetConfig.isPublic,
                chatters: [],
            };
        }
        const existing = ctx.room.roomState.roomData.chatters.find((c) => c.peerId === chatter.peerId);
        if (existing) {
            Object.assign(existing, chatter);
        } else {
            ctx.room.roomState.roomData.chatters.push(chatter);
        }
        previousHandlersCtx.newPeerId = chatter.peerId;
        previousHandlersCtx.chatter = chatter;
    };

    public static chatterRemoved: BotEventHandlerFn = (ctx) => {
        const peerId = typeof ctx.message.args[0] === "object" ? ctx.message.args[0]?.peerId : ctx.message.args[0];
        if (ctx.room.roomState.roomData) {
            ctx.room.roomState.roomData.chatters = ctx.room.roomState.roomData.chatters.filter((c) => c.peerId !== peerId);
        }
    };
}
