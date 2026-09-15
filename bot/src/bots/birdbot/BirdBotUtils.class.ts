import { createHash } from "crypto";
import type z from "zod";
import { CommandOrEventCtx } from "../../lib/class/CommandUtils.class";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { defaultBonusAlphabetsByDictionaryId, dictionaryManifests } from "../../lib/constants/gameConstants";
import type {
    Chatter,
    CustomBonusAlphabet,
    DictionaryId,
    DictionaryLessGameRules,
    GameRules,
} from "../../lib/types/gameTypes";
import { bonusAlphabetToLetters } from "../../lib/types/gameTypes";
import type { BotEventHandlerFn, EventCtx } from "../../lib/types/libEventTypes";
import { birdbotLanguageToDictionaryId, birdbotModeRules, dictionaryIdToBirdbotLanguage, recordsUtils } from "./BirdBotConstants";
import { API_KEY, API_URL } from "./BirdBotEnv";
import {
    BirdBotGameData,
    BirdBotGameMode,
    BirdBotGameRecap,
    BirdBotLanguage,
    BirdBotPlayerData,
    BirdBotRecordType,
    BirdBotRoomMetadata,
    BirdBotSupportedDictionaryId,
    BirdBotWordData,
    DictionaryResource,
    ExperienceData,
    PlayerGameScores,
} from "./BirdBotTypes";
import BirdBotGameplayStateService from "./services/BirdBotGameplayState.service";
import BirdBotApiWriteQueue from "./services/BirdBotApiWriteQueue.service";
import BirdBotModerationService from "./services/BirdBotModeration.service";
import BirdBotWordSelectionService from "./services/BirdBotWordSelection.service";
import { l, t } from "./texts/BirdBotTextUtils";

export type ApiResponseAllRecords = {
    message: string;
    bestScores: {
        id: string;
        name: string;
        accountName: string;
        score: number;
        recordType: BirdBotRecordType;
        xp: ExperienceData;
    }[];
};

export type ApiResponseBestScoresSpecificRecord = {
    message: string;
    bestScores: {
        player_id: string;
        player_username: string;
        score: number;
        rank: number;
    }[];
};

export default class BirdBotUtils {
    public static handleMyTurn: BotEventHandlerFn = (ctx) => {
        const currentPlayer = Utilitary.getCurrentPlayer(ctx.room.roomState.gameData!);
        if (!currentPlayer) {
            return;
        }
        if (currentPlayer.peerId !== ctx.room.roomState.myPeerId) return;
        const myPlayer = currentPlayer;
        const history = ctx.room.roomState.wordHistory;
        const prompt = ctx.room.roomState.gameData!.milestone.name === "round"
            ? ctx.room.roomState.gameData!.milestone.syllable
            : "";
        if (!prompt) return;

        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        if (!roomMetadata.scoresByPeerId[myPlayer.peerId]) {
            this.initializeScoresForPlayerId(roomMetadata, myPlayer.peerId);
        }
        const foundWord = BirdBotWordSelectionService.select({
            ctx,
            prompt,
            history,
            lives: myPlayer.lives,
            maxLives: ctx.room.roomState.gameData!.rules.maxLives,
            bonusLetters: myPlayer.bonusLetters,
            requiredLetters: ctx.room.roomState.gameData!.dictionaryManifest.bonusLetters,
            scores: roomMetadata.scoresByPeerId[myPlayer.peerId]!,
        });
        this.submitWord({
            word: foundWord ?? "/suicide",
            setWord: ctx.utils.setWord,
        });
    };

    public static getTopFlipWords = (
        dictionary: string[],
        letterRarityScores: Record<string, number>,
        dictionaryId: DictionaryId,
        n: number
    ): { word: string; score: number }[] => {
        const necessaryLetters = dictionaryManifests[dictionaryId].bonusLetters;
        return dictionary
            .map((word) => {
                const score = this.evaluateFlipWord(word, letterRarityScores, necessaryLetters, "");
                return { word, score: Math.round(score * 100) / 100 };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, n);
    };

    public static evaluateSnWord = (word: string, syllablesCount: Record<string, number>) => {
        const wordSyllables = this.splitWordIntoSyllables(word);
        let score = 0;
        for (let syllable in wordSyllables) {
            if (syllablesCount[syllable] === undefined) {
                Logger.error({
                    message: `Syllable ${syllable} not found in syllablesCount. This should never happen.`,
                    path: "BirdBotUtils.class.ts",
                });
                throw new Error(`Syllable ${syllable} not found in syllablesCount. This should never happen.`);
            }
            const beforePlacingWord = syllablesCount[syllable]!;
            const afterPlacingWord = beforePlacingWord - wordSyllables[syllable]!;
            const depletionPercentage = (beforePlacingWord - afterPlacingWord) / beforePlacingWord;
            const syllableScore = Math.pow(depletionPercentage, 2);
            score += syllableScore;
        }
        return score;
    };

    public static getTopSnWords = (
        dictionary: string[],
        syllablesCount: Record<string, number>,
        n: number
    ): { word: string; score: number }[] => {
        return dictionary
            .map((word) => {
                const score = this.evaluateSnWord(word, syllablesCount);
                return { word, score: Math.round(score * 100) / 100 };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, n);
    };

    public static getApiPlayerData = (player: Chatter) => {
        return {
            accountName: player.authId ?? "",
            nickname: player.nickname,
        } as BirdBotPlayerData;
    };

    public static handlePlayerDeath = async (ctx: EventCtx, peerId: number) => {
        const gameRecap = BirdBotUtils.getApiGameRecap(ctx, peerId);
        const gamer = ctx.room.roomState.roomData!.chatters.find((c) => c.peerId === peerId);

        if (!gamer) {
            Logger.error({
                message: `Chatter ${peerId} not found in room ${ctx.room.constantRoomData.roomCode}. This should never happen.`,
                path: "BirdBotUtils.class.ts",
            });
            throw new Error(
                `Chatter ${peerId} not found in room ${ctx.room.constantRoomData.roomCode}. This should never happen.`
            );
        }
        const timeSurvived = gameRecap.diedAt - ctx.room.roomState.roundStartTimestamp;

        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;

        if (!BirdBotGameplayStateService.isScoreEligible(ctx)) {
            const scores = BirdBotUtils.getFormattedPlayerScores(roomMetadata.scoresByPeerId[peerId], l(ctx));
            ctx.utils.sendChatMessage(
                t("parity.gameplay.unrankedScores", {
                    username: gamer.nickname,
                    scores: scores || t("parity.gameplay.noScores", { lng: l(ctx) }),
                    lng: l(ctx),
                }),
                "neutral",
            );
            return;
        }

        if (!gamer.authId) {
            ctx.utils.sendChatMessage(
                t("parity.gameplay.scoresNotSaved", {
                    username: gamer.nickname,
                    reason: t("parity.gameplay.scoresNotSavedGuest", { lng: l(ctx) }),
                    lng: l(ctx),
                }),
                "info",
            );
            return;
        }

        if (await BirdBotModerationService.isBlacklisted(gamer.authId)) {
            ctx.utils.sendChatMessage(
                t("parity.gameplay.scoresNotSaved", {
                    username: gamer.nickname,
                    reason: t("parity.gameplay.scoresNotSavedBlacklisted", { lng: l(ctx) }),
                    lng: l(ctx),
                }),
                "info",
            );
            return;
        }

        BirdBotUtils.registerGameRecap(gameRecap).then((data) => {
            if (!ctx.room.isHealthy()) return;
            if (!data) {
                ctx.utils.sendChatMessage(
                    t("parity.gameplay.scoresNotSaved", {
                        username: gamer.nickname,
                        reason: t("parity.gameplay.scoresNotSavedApi", { lng: l(ctx) }),
                        lng: l(ctx),
                    }),
                    "info",
                );
                return;
            }
            if (gameRecap.wordsCount === 0) {
                ctx.utils.sendChatMessage(
                    t("general.playerStats.diedNoWords", {
                        username: gamer.nickname,
                        lng: l(ctx),
                    })
                );
            } else {
                const scores = BirdBotUtils.getFormattedPlayerScores(roomMetadata.scoresByPeerId[peerId], l(ctx));
                if (data.oldXpData.level < data.newXpData.level) {
                    ctx.utils.sendChatMessage(
                        t("general.playerStats.diedLevelUp", {
                            username: gamer.nickname,
                            time: recordsUtils.time.format(timeSurvived),
                            scores,
                            gainedXp: data.newXpData.xp - data.oldXpData.xp,
                            oldLevel: data.oldXpData.level,
                            newLevel: data.newXpData.level,
                            oldCurrentLevelXp: data.oldXpData.currentLevelXp,
                            newCurrentLevelXp: data.newXpData.currentLevelXp,
                            oldTotalLevelXp: data.oldXpData.totalLevelXp,
                            newTotalLevelXp: data.newXpData.totalLevelXp,
                            lng: l(ctx),
                        })
                    );
                } else {
                    ctx.utils.sendChatMessage(
                        t("general.playerStats.died", {
                            username: gamer.nickname,
                            time: recordsUtils.time.format(timeSurvived),
                            scores,
                            gainedXp: data.newXpData.xp - data.oldXpData.xp,
                            lng: l(ctx),
                        })
                    );
                }
            }
        });
    };

    public static findValueInAliasesObject = <T extends string>(values: string[], aliases: Record<T, string[]>): T | null => {
        return this.findValuesInAliasesObject(values, aliases)?.[0] ?? null;
    };

    public static findValuesInAliasesObject = <T extends string>(values: string[], aliases: Record<T, string[]>): T[] => {
        const targetItems: T[] = [];
        for (const str of values) {
            for (const item in aliases) {
                for (const alias of aliases[item]) {
                    if (str === alias && !targetItems.includes(item)) {
                        targetItems.push(item);
                    }
                }
            }
        }
        return targetItems;
    };

    public static getApiGameRecap = (ctx: EventCtx, peerId: number): BirdBotGameRecap => {
        const gamer = ctx.room.roomState.roomData!.chatters.find((c) => c.peerId === peerId);
        if (!gamer) {
            throw new Error("Chatter not found");
        }
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        const playerScores = roomMetadata.scoresByPeerId[peerId];
        if (!playerScores) {
            throw new Error("Player scores not found");
        }
        const playerData = this.getApiPlayerData(gamer);
        return {
            game: this.getApiGameData(ctx),
            player: playerData,
            diedAt: new Date().getTime(),
            wordsCount: playerScores.words,
            flipsCount: playerScores.flips,
            depletedSyllablesCount: playerScores.depletedSyllables,
            alphaCount: playerScores.alpha,
            wordsWithoutDeathCount: playerScores.maxWordsWithoutDeath,
            previousSyllablesCount: playerScores.previousSyllableScore,
            multiSyllablesCount: playerScores.multiSyllables,
            hyphenWordsCount: playerScores.hyphenWords,
            moreThan20LettersWordsCount: playerScores.moreThan20LettersWords,
            slursCount: playerScores.slurs,
            creaturesCount: playerScores.creatures,
            ethnonymsCount: playerScores.ethnonyms,
            chemicalsCount: playerScores.chemicals,
            plantsCount: playerScores.plants,
            foodsCount: playerScores.foods,
            adverbsCount: playerScores.adverbs,
        };
    };

    public static passedMilestone = (beforeScore: number, afterScore: number, milestone: number): number | null => {
        const beforeRest = beforeScore % milestone;
        const beforeMilestone = (beforeScore - beforeRest) / milestone;
        const afterRest = afterScore % milestone;
        const afterMilestone = (afterScore - afterRest) / milestone;
        if (beforeMilestone < afterMilestone) {
            return afterMilestone * milestone;
        }
        return null;
    };

    public static registerGameRecap = async (gameRecap: BirdBotGameRecap) => {
        const idempotencyKey = BirdBotApiWriteQueue.makeRecapKey(
            gameRecap.game.id,
            gameRecap.player.accountName,
        );
        const res = (await BirdBotApiWriteQueue.enqueueGameRecap(gameRecap as unknown as Record<string, unknown>, idempotencyKey)) as {
            oldXpData: ExperienceData;
            newXpData: ExperienceData;
        } | null;
        return res;
    };

    public static registerWord = async (wordData: BirdBotWordData, turnKey = "unknown") => {
        if (!wordData.player.accountName) return null;
        if (await BirdBotModerationService.isBlacklisted(wordData.player.accountName)) return null;
        const idempotencyKey = BirdBotApiWriteQueue.makeWordKey(
            wordData.game.id,
            turnKey,
            wordData.submitResult,
        );
        BirdBotApiWriteQueue.enqueueWord({ ...wordData, idempotencyKey });
        return null;
    };

    public static queueSuccessfulWordRegistration = (
        ctx: EventCtx,
        turnKey: string,
        data: Omit<BirdBotWordData, "flip">
    ) => {
        if (!BirdBotGameplayStateService.isScoreEligible(ctx)) return;
        if (!data.player.accountName) return;
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        if (roomMetadata.pendingWordRegistrations.has(turnKey)) return;
        roomMetadata.pendingWordRegistrations.set(turnKey, { turnKey, data });
        if (roomMetadata.flipTurnKeys.has(turnKey)) {
            this.flushWordRegistration(ctx, turnKey, true);
        }
    };

    public static markFlipForTurn = (ctx: EventCtx, turnKey: string) => {
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        const isNewFlip = !roomMetadata.flipTurnKeys.has(turnKey);
        roomMetadata.flipTurnKeys.add(turnKey);
        this.flushWordRegistration(ctx, turnKey, true);
        return isNewFlip;
    };

    public static flushWordRegistration = (ctx: EventCtx, turnKey: string, flip?: boolean) => {
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        const pending = roomMetadata.pendingWordRegistrations.get(turnKey);
        if (!pending) return;
        roomMetadata.pendingWordRegistrations.delete(turnKey);
        void this.registerWord(
            {
                ...pending.data,
                flip: flip ?? roomMetadata.flipTurnKeys.has(turnKey),
            },
            turnKey,
        );
    };

    public static flushAllWordRegistrations = (ctx: EventCtx) => {
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        for (const turnKey of [...roomMetadata.pendingWordRegistrations.keys()]) {
            this.flushWordRegistration(ctx, turnKey);
        }
    };

    public static registerGame = async (gameData: BirdBotGameData) => {
        const res = await this.postJsonToApi("/game", gameData, "PUT");
        return res;
    };

    public static getApiGameData = (ctx: EventCtx) => {
        const gameData = ctx.room.roomState.gameData!;
        const language = dictionaryIdToBirdbotLanguage[gameData.rules.dictionaryId as BirdBotSupportedDictionaryId];
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        if (!language) {
            Logger.error({
                message: `Language ${gameData.rules.dictionaryId} not supported. This should never happen.`,
                path: "BirdBotUtils.class.ts",
            });
            throw new Error(`Language ${gameData.rules.dictionaryId} not supported. This should never happen.`);
        }
        return {
            id: Utilitary.valueToUUID(ctx.room.roomState.roundStartTimestamp.toString()),
            lang: language,
            mode: roomMetadata.gameMode,
        } as BirdBotGameData;
    };

    public static isMainRoom = (ctx: CommandOrEventCtx) => {
        return ctx.room.constantRoomData.roomCreatorAuthId === null;
    };

    public static bonusAlphabetsEqual = (a: CustomBonusAlphabet | undefined, b: CustomBonusAlphabet | undefined) => {
        return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
    };

    public static getDefaultBonusAlphabet = (dictionaryId: DictionaryId): CustomBonusAlphabet => {
        return { ...defaultBonusAlphabetsByDictionaryId[dictionaryId] };
    };

    public static applyLocalRuleUpdates = (ctx: CommandOrEventCtx, updates: Record<string, unknown>) => {
        const gameData = ctx.room.roomState.gameData!;
        Object.assign(gameData.rules, updates);
        if (updates.customBonusAlphabet && typeof updates.customBonusAlphabet === "object") {
            const letters = bonusAlphabetToLetters(updates.customBonusAlphabet as CustomBonusAlphabet);
            gameData.dictionaryManifest.bonusLetters = letters;
            if (gameData.milestone.dictionaryManifest) {
                gameData.milestone.dictionaryManifest.bonusLetters = letters;
            }
        }
    };

    public static setRoomGameMode = (ctx: CommandOrEventCtx, mode: DictionaryLessGameRules) => {
        const gameData = ctx.room.roomState.gameData!;
        const updates: Record<string, unknown> = {};
        for (const rule of Object.keys(mode) as (keyof DictionaryLessGameRules)[]) {
            if (gameData.rules[rule] !== mode[rule]) {
                updates[rule] = mode[rule];
            }
        }
        const expectedAlphabet = this.getDefaultBonusAlphabet(gameData.rules.dictionaryId);
        if (!this.bonusAlphabetsEqual(gameData.rules.customBonusAlphabet, expectedAlphabet)) {
            updates.customBonusAlphabet = expectedAlphabet;
        }
        if (Object.keys(updates).length > 0) {
            Logger.log({
                message: `Setting game mode rules: ${JSON.stringify(updates)}`,
                path: "BirdBotUtils.class.ts",
            });
            this.applyLocalRuleUpdates(ctx, updates);
            ctx.utils.setRules(updates);
        }
    };

    public static setRoomDictionary = (ctx: CommandOrEventCtx, dictionaryId: DictionaryId) => {
        const gameData = ctx.room.roomState.gameData!;
        const updates: Record<string, unknown> = {};
        if (gameData.rules.dictionaryId !== dictionaryId) {
            updates.dictionaryId = dictionaryId;
        }
        const expectedAlphabet = this.getDefaultBonusAlphabet(dictionaryId);
        if (!this.bonusAlphabetsEqual(gameData.rules.customBonusAlphabet, expectedAlphabet)) {
            updates.customBonusAlphabet = expectedAlphabet;
        }
        if (Object.keys(updates).length > 0) {
            Logger.log({
                message: `Setting dictionary to ${dictionaryId}`,
                path: "BirdBotUtils.class.ts",
            });
            this.applyLocalRuleUpdates(ctx, updates);
            ctx.utils.setRules(updates);
        }
    };

    public static setRoomGameRuleIfDifferent = (ctx: CommandOrEventCtx, rule: keyof GameRules, value: any) => {
        if (rule === "dictionaryId") {
            this.setRoomDictionary(ctx, value as DictionaryId);
            return;
        }
        if (rule === "customBonusAlphabet") {
            if (!this.bonusAlphabetsEqual(ctx.room.roomState.gameData!.rules.customBonusAlphabet, value)) {
                const updates = { customBonusAlphabet: value };
                this.applyLocalRuleUpdates(ctx, updates);
                ctx.utils.setRules(updates);
            }
            return;
        }
        if (ctx.room.roomState.gameData!.rules[rule] !== value) {
            Logger.log({
                message: `Setting rule ${rule} to value ${value}`,
                path: "BirdBotUtils.class.ts",
            });
            const updates = { [rule]: value };
            this.applyLocalRuleUpdates(ctx, updates);
            ctx.utils.setRules(updates);
        } else {
            Logger.log({
                message: `Rule ${rule} is already set to the correct value. Skipping.`,
                path: "BirdBotUtils.class.ts",
            });
        }
    };

    public static detectRoomGameMode = (ctx: EventCtx) => {
        const gameData = ctx.room.roomState.gameData!;
        const expectedAlphabet = this.getDefaultBonusAlphabet(gameData.rules.dictionaryId);
        const alphabetMatches = this.bonusAlphabetsEqual(gameData.rules.customBonusAlphabet, expectedAlphabet);

        let foundCorrespondingGameMode = false;
        for (const gameModeKey in birdbotModeRules) {
            const gameMode = birdbotModeRules[gameModeKey as BirdBotGameMode];
            let isGameModeMatching = alphabetMatches;
            if (isGameModeMatching) {
                for (const ruleKey in gameMode) {
                    type Rule = keyof typeof gameMode;
                    const ruleValue = gameMode[ruleKey as Rule];
                    if (gameData.rules[ruleKey as Rule] !== ruleValue) {
                        isGameModeMatching = false;
                        break;
                    }
                }
            }
            if (isGameModeMatching) {
                Logger.log({
                    message: `Game mode ${gameModeKey} is matching.`,
                    path: "BirdBotEventHandlers.ts",
                });
                const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
                const isGameModeAlreadySet = roomMetadata.gameMode === (gameModeKey as BirdBotGameMode);
                if (!isGameModeAlreadySet) {
                    roomMetadata.gameMode = gameModeKey as BirdBotGameMode;
                    ctx.utils.sendChatMessage(
                        t("general.roomState.gameModeSet", {
                            gameMode: t(`lib.mode.${gameModeKey}`, {
                                lng: l(ctx),
                            }),
                            lng: l(ctx),
                        })
                    );
                }
                foundCorrespondingGameMode = true;
                break;
            }
        }
        if (!foundCorrespondingGameMode) {
            Logger.log({
                message: "No corresponding game mode found. Setting game mode to custom.",
                path: "BirdBotEventHandlers.ts",
            });
            const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
            roomMetadata.gameMode = "custom";
        }
    };

    public static findNumberInArgs = (args: string[]): number | null => {
        const number = args.find((arg) => !isNaN(Number(arg)));
        return number ? Number(number) : null;
    };

    public static getJsonFromApi = async <T>(url: string) => {
        return await fetch(`${API_URL}${url}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
            },
        });
    };

    public static postJsonToApi = async <T>(url: string, body: any, method: "POST" | "PUT" | "DELETE"): Promise<T | null> => {
        const logError = (error: any) => {
            Logger.error({
                message: `Failed to post to ${url} with method ${method}`,
                path: "BirdBotUtils.class.ts",
                error,
                json: body,
            });
        };
        try {
            const res = await fetch(`${API_URL}${url}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${API_KEY}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                logError(res);
                return null;
            }
            return (await res.json()) as T;
        } catch (error) {
            logError(error);
            return null;
        }
    };

    public static getRecordsFromApi = async ({
        language,
        gameMode,
        recordType,
        page,
    }: {
        language: BirdBotLanguage;
        gameMode: BirdBotGameMode;
        recordType?: BirdBotRecordType;
        page?: number;
    }) => {
        if (recordType) {
            return await this.getJsonFromApi<ApiResponseBestScoresSpecificRecord>(
                `/records?lang=${language}&mode=${gameMode}&page=${page ?? 1}&perPage=5&record=${recordType}`
            );
        } else {
            return await this.getJsonFromApi<ApiResponseAllRecords>(`/records?lang=${language}&mode=${gameMode}`);
        }
    };

    public static findTargetItemInZodEnum = <T>(params: string[], schema: z.ZodSchema<T>): T | null => {
        const validParam = params.find((param) => schema.safeParse(param).success);
        if (validParam) {
            return validParam as T;
        }
        return null;
    };

    public static findBestUsernameMatch = (str: string, chatters: Chatter[]): Chatter | null => {
        const perfectMatch = chatters.find((c) => c.nickname === str);
        if (perfectMatch) return perfectMatch;
        const perfectCaseInsensitiveMatch = chatters.find((c) => c.nickname.toLowerCase() === str.toLowerCase());
        if (perfectCaseInsensitiveMatch) return perfectCaseInsensitiveMatch;
        const startsWithMatch = chatters.find((c) => c.nickname.toLowerCase().startsWith(str.toLowerCase()));
        if (startsWithMatch) return startsWithMatch;
        const includeMatch = chatters.find((c) => c.nickname.toLowerCase().includes(str.toLowerCase()));
        if (includeMatch) return includeMatch;
        return null;
    };

    public static submitWord = ({ word, setWord }: { word: string; setWord: (word: string) => void }) => {
        setWord(word);
    };

    public static getRandomValidWord = ({
        dictionary,
        isWordValid,
    }: {
        dictionary: string[];
        isWordValid: (word: string) => boolean;
    }): string | null => {
        const randomIndex = Math.floor(Math.random() * dictionary.length);

        let foundWord = null;
        for (let i = randomIndex; i < dictionary.length; i++) {
            const word = dictionary[i]!;
            if (isWordValid(word)) {
                foundWord = word;
                break;
            }
        }
        if (!foundWord) {
            for (let i = 0; i < randomIndex; i++) {
                const word = dictionary[i]!;
                if (isWordValid(word)) {
                    foundWord = word;
                    break;
                }
            }
        }
        return foundWord;
    };

    public static evaluateFlipWord = (
        word: string,
        letterRarityScores: Record<string, number>,
        requiredLetters: string,
        placedLetters: string
    ) => {
        const requiredLettersSet = new Set(requiredLetters);
        const placedLettersSet = new Set(placedLetters);

        let wordScore = 0;
        const alreadyEvaluatedLetters = new Set<string>();
        for (const letter of word) {
            if (alreadyEvaluatedLetters.has(letter)) continue;
            if (letterRarityScores[letter] !== undefined && !placedLettersSet.has(letter) && requiredLettersSet.has(letter)) {
                wordScore += letterRarityScores[letter]!;
            }
            alreadyEvaluatedLetters.add(letter);
        }

        return wordScore;
    };

    public static getBestFlipWord = ({
        dictionaryResource,
        requiredLetters,
        placedLetters,
        isWordValid,
    }: {
        dictionaryResource: DictionaryResource;
        requiredLetters: string;
        placedLetters: string;
        isWordValid: (word: string) => boolean;
    }): string | null => {
        const letterRarityScores = dictionaryResource.metadata.letterRarityScores;

        const maxPossibleScore = this.evaluateFlipWord(requiredLetters, letterRarityScores, requiredLetters, placedLetters);
        let bestWord: [string, number] | null = null;
        const randomStartIndex = Math.floor(Math.random() * dictionaryResource.resource.length);
        for (let i = randomStartIndex; i < dictionaryResource.resource.length; i++) {
            const word = dictionaryResource.resource[i]!;
            if (!isWordValid(word)) continue;
            const score = this.evaluateFlipWord(word, letterRarityScores, requiredLetters, placedLetters);
            if (bestWord === null || score > bestWord[1]) {
                bestWord = [word, score];
                if (Math.abs(maxPossibleScore - score) < 0.001) break;
            }
        }
        for (let i = 0; i < randomStartIndex; i++) {
            const word = dictionaryResource.resource[i]!;
            if (!isWordValid(word)) continue;
            const score = this.evaluateFlipWord(word, letterRarityScores, requiredLetters, placedLetters);
            if (bestWord === null || score > bestWord[1]) {
                bestWord = [word, score];
                if (Math.abs(maxPossibleScore - score) < 0.001) break;
            }
        }
        return bestWord ? bestWord[0] : null;
    };

    public static initializeScoresForPlayerId = (roomMetadata: BirdBotRoomMetadata, peerId: number) => {
        roomMetadata.scoresByPeerId[peerId] = {
            alpha: 0,
            words: 0,
            flips: 0,
            depletedSyllables: 0,
            previousSyllableScore: 0,
            previousSyllable: null,
            multiSyllables: 0,
            currentWordsWithoutDeath: 0,
            maxWordsWithoutDeath: 0,
            hyphenWords: 0,
            moreThan20LettersWords: 0,
            slurs: 0,
            creatures: 0,
            ethnonyms: 0,
            chemicals: 0,
            plants: 0,
            foods: 0,
            adverbs: 0,
        };
    };

    public static splitWordIntoValidSubwords = (word: string): string[] => {
        const result: string[] = [];
        let startIndex = 0;
        const len = word.length;

        for (let i = 0; i <= len; i++) {
            const char = word[i];
            if (char === "'" || char === "-" || i === len) {
                const subLen = i - startIndex;
                if (subLen > 1) {
                    result.push(word.substring(startIndex, i));
                }
                startIndex = i + 1;
            }
        }

        return result;
    };

    public static splitWordIntoSyllables = (word: string) => {
        const syllables: Record<string, number> = {};
        const subwords = this.splitWordIntoValidSubwords(word);
        for (const subword of subwords) {
            for (let syllableLength = 2; syllableLength <= 3; syllableLength++) {
                for (let letterIndex = 0; letterIndex <= subword.length - syllableLength; letterIndex++) {
                    const syllable = subword.substring(letterIndex, letterIndex + syllableLength);
                    syllables[syllable] = (syllables[syllable] ?? 0) + 1;
                }
            }
        }
        return syllables;
    };

    public static getCurrentRoomLanguage = (ctx: CommandOrEventCtx) => {
        const roomDictionaryId = ctx.room.roomState.gameData!.rules.dictionaryId;
        const roomLanguage = dictionaryIdToBirdbotLanguage[roomDictionaryId as BirdBotSupportedDictionaryId];
        if (!roomLanguage) {
            Logger.error({
                message: `Tried to create a room for unsupported dictionary id ${roomDictionaryId}. This should not happen.`,
                path: "BirdBotUtils.class.ts",
            });
            throw new Error(`Tried to create a room for unsupported dictionary id ${roomDictionaryId}. This should not happen.`);
        }
        return roomLanguage;
    };

    public static getCurrentDictionaryResource = (ctx: CommandOrEventCtx) => {
        const roomLanguage = this.getCurrentRoomLanguage(ctx);
        return ctx.bot.getResource<DictionaryResource>(`dictionary-${roomLanguage}`);
    };

    public static handleWordAdditionToDictionaryResource = async (ctx: EventCtx, roomLanguage: BirdBotLanguage, word: string) => {
        Logger.log({
            message: `Adding word ${word} to dictionary resource`,
            path: "BirdBotUtils.class.ts",
        });
        const dictionaryResource = ctx.bot.getResource<DictionaryResource>(`dictionary-${roomLanguage}`);
        dictionaryResource.resource.push(word);
        // Do not update the letter rarity scores
        // Update the syllables count
        const wordSyllables = this.splitWordIntoSyllables(word);
        for (const syllable in wordSyllables) {
            dictionaryResource.metadata.syllablesCount[syllable] =
                (dictionaryResource.metadata.syllablesCount[syllable] ?? 0) + wordSyllables[syllable]!;
            Logger.log({
                message: `Updated syllables count for syllable ${syllable} to ${dictionaryResource.metadata.syllablesCount[syllable]}`,
                path: "BirdBotUtils.class.ts",
            });
        }
        // Update the top flip words
        const roomDictionaryId = birdbotLanguageToDictionaryId[roomLanguage];
        const flipScore = this.evaluateFlipWord(
            word,
            dictionaryResource.metadata.letterRarityScores,
            dictionaryManifests[roomDictionaryId].bonusLetters,
            ""
        );
        if (flipScore > dictionaryResource.metadata.topFlipWords[dictionaryResource.metadata.topFlipWords.length - 1][1]) {
            dictionaryResource.metadata.topFlipWords.push([word, flipScore]);
            Utilitary.insertionSort(dictionaryResource.metadata.topFlipWords, (a, b) => b[1] - a[1]);
            Logger.log({
                message: `Added word ${word} with score ${flipScore} to top flip words`,
                path: "BirdBotUtils.class.ts",
            });
        } else {
            Logger.log({
                message: `Word ${word} with score ${flipScore} is not in top flip words`,
                path: "BirdBotUtils.class.ts",
            });
        }
        // Update the top sn words
        const snScore = this.evaluateSnWord(word, dictionaryResource.metadata.syllablesCount);
        if (snScore > dictionaryResource.metadata.topSnWords[dictionaryResource.metadata.topSnWords.length - 1][1]) {
            dictionaryResource.metadata.topSnWords.push([word, snScore]);
            Utilitary.insertionSort(dictionaryResource.metadata.topSnWords, (a, b) => b[1] - a[1]);
            Logger.log({
                message: `Added word ${word} with score ${snScore} to top sn words`,
                path: "BirdBotUtils.class.ts",
            });
        } else {
            Logger.log({
                message: `Word ${word} with score ${snScore} is not in top sn words`,
                path: "BirdBotUtils.class.ts",
            });
        }
        dictionaryResource.metadata.changed = true;
    };

    public static handleWordRemovalFromDictionaryResource = async (
        ctx: EventCtx,
        roomLanguage: BirdBotLanguage,
        wordIndex: number,
        word: string
    ) => {
        const dictionaryResource = ctx.bot.getResource<DictionaryResource>(`dictionary-${roomLanguage}`);
        dictionaryResource.resource.splice(wordIndex, 1);

        // Do not update the letter rarity scores
        // Update the syllables count
        const wordSyllables = this.splitWordIntoSyllables(word);
        for (const syllable in wordSyllables) {
            if (dictionaryResource.metadata.syllablesCount[syllable] === undefined) {
                throw new Error(`Syllable ${syllable} not found in dictionary resource`);
            }
            dictionaryResource.metadata.syllablesCount[syllable] =
                dictionaryResource.metadata.syllablesCount[syllable]! - wordSyllables[syllable]!;
            Logger.log({
                message: `Updated syllables count for syllable ${syllable} to ${dictionaryResource.metadata.syllablesCount[syllable]}`,
                path: "BirdBotUtils.class.ts",
            });
            if (dictionaryResource.metadata.syllablesCount[syllable]! <= 0) {
                delete dictionaryResource.metadata.syllablesCount[syllable];
                Logger.log({
                    message: `Deleted syllable ${syllable} from syllables count as it is now 0`,
                    path: "BirdBotUtils.class.ts",
                });
            }
        }
        // Update the top flip words
        const topFlipWords = dictionaryResource.metadata.topFlipWords;
        let deletedFromTopFlipWords = false;
        for (const topFlipWord of topFlipWords) {
            if (topFlipWord[0] === word) {
                topFlipWords.splice(topFlipWords.indexOf(topFlipWord), 1);
                Logger.log({
                    message: `Deleted word ${word} from top flip words`,
                    path: "BirdBotUtils.class.ts",
                });
                deletedFromTopFlipWords = true;
                break;
            }
        }
        if (deletedFromTopFlipWords) {
            Logger.log({
                message: `Word ${word} was deleted from top flip words`,
                path: "BirdBotUtils.class.ts",
            });
        } else {
            Logger.log({
                message: `Word ${word} was not found in top flip words`,
                path: "BirdBotUtils.class.ts",
            });
        }
        // Update the top sn words
        const topSnWords = dictionaryResource.metadata.topSnWords;
        let deletedFromTopSnWords = false;
        for (const topSnWord of topSnWords) {
            if (topSnWord[0] === word) {
                topSnWords.splice(topSnWords.indexOf(topSnWord), 1);
                Logger.log({
                    message: `Deleted word ${word} from top sn words`,
                    path: "BirdBotUtils.class.ts",
                });
                deletedFromTopSnWords = true;
                break;
            }
        }
        if (deletedFromTopSnWords) {
            Logger.log({
                message: `Word ${word} was deleted from top sn words`,
                path: "BirdBotUtils.class.ts",
            });
        } else {
            Logger.log({
                message: `Word ${word} was not found in top sn words`,
                path: "BirdBotUtils.class.ts",
            });
        }

        dictionaryResource.metadata.changed = true;
    };

    public static getDictionaryHash = (dictionaryResource: DictionaryResource) => {
        const hash = createHash("sha256");
        const dictionaryLanguage = dictionaryResource.metadata.language;
        const dictionaryLength = dictionaryResource.resource.length;
        hash.update(dictionaryLanguage);
        hash.update(dictionaryLength.toString());
        for (let i = 0; i < 20; i++) {
            const index = Math.floor((dictionaryLength * i) / 20);
            hash.update(dictionaryResource.resource[index]);
        }
        return hash.digest("hex");
    };

    public static setupRoomMetadata = (ctx: EventCtx) => {
        Logger.log({
            message: "Setting up room metadata",
            path: "BirdBotUtils.class.ts",
        });
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        BirdBotGameplayStateService.initialize(roomMetadata);
        BirdBotGameplayStateService.resetIfLanguageChanged(ctx);
        this.detectRoomGameMode(ctx);
        roomMetadata.scoresByPeerId = {};
        roomMetadata.globalScores = {
            flips: 0,
            previousSyllables: 0,
            hyphenWords: 0,
            moreThan20LettersWords: 0,
            multiSyllables: 0,
            depletedSyllables: 0,
            slurs: 0,
            creatures: 0,
            ethnonyms: 0,
            chemicals: 0,
            plants: 0,
            foods: 0,
            adverbs: 0,
        };
        roomMetadata.hostLeftIteration = 0;
        roomMetadata.greetedPeerIds = new Set();
        roomMetadata.pendingWordRegistrations = new Map();
        roomMetadata.flipTurnKeys = new Set();
        roomMetadata.scoredWordTurnKeys = new Set();
        this.initializeScoresForAllPlayers(ctx);
        const currentDictionaryResource = this.getCurrentDictionaryResource(ctx);
        roomMetadata.remainingSyllables = Object.assign({}, currentDictionaryResource.metadata.syllablesCount);
        roomMetadata.wasInitialized = true;
    };

    public static initializeScoresForAllPlayers = (ctx: EventCtx) => {
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        const gameData = ctx.room.roomState.gameData!;
        if (gameData.milestone.name === "round") {
            for (const peerId of Object.keys(gameData.milestone.playerStatesByPeerId)) {
                this.initializeScoresForPlayerId(roomMetadata, Number(peerId));
            }
        } else {
            for (const player of gameData.players) {
                this.initializeScoresForPlayerId(roomMetadata, player.profile.peerId);
            }
        }
    };

    public static getFormattedPlayerScores = (playerStats: PlayerGameScores, lng: BirdBotLanguage) => {
        const scores = [
            ["word", playerStats.words],
            ["flips", playerStats.flips],
            ["depleted_syllables", playerStats.depletedSyllables],
            ["alpha", playerStats.alpha],
            ["no_death", playerStats.maxWordsWithoutDeath],
            ["multi_syllable", playerStats.multiSyllables],
            ["previous_syllable", playerStats.previousSyllableScore],
            ["hyphen", playerStats.hyphenWords],
            ["more_than_20_letters", playerStats.moreThan20LettersWords],
            ["slur", playerStats.slurs],
            ["creature", playerStats.creatures],
            ["ethnonym", playerStats.ethnonyms],
            ["chemical", playerStats.chemicals],
            ["plant", playerStats.plants],
            ["food", playerStats.foods],
            ["adverb", playerStats.adverbs],
        ] satisfies [BirdBotRecordType, number][];

        return scores
            .filter((x) => x[1] !== 0)
            .sort((a, b) => recordsUtils[a[0]].order - recordsUtils[b[0]].order)
            .map((x) =>
                t(`lib.recordType.${x[0]}.score`, {
                    context: "specific",
                    count: x[1],
                    formattedScore: recordsUtils[x[0]].format(x[1]),
                    lng,
                })
            )
            .join(" — ");
    };

    public static resetRoomMetadata = (ctx: EventCtx) => {
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        this.flushAllWordRegistrations(ctx);
        roomMetadata.scoresByPeerId = {};
        roomMetadata.globalScores = {
            flips: 0,
            previousSyllables: 0,
            hyphenWords: 0,
            moreThan20LettersWords: 0,
            multiSyllables: 0,
            depletedSyllables: 0,
            slurs: 0,
            creatures: 0,
            ethnonyms: 0,
            chemicals: 0,
            plants: 0,
            foods: 0,
            adverbs: 0,
        };
        roomMetadata.pendingWordRegistrations.clear();
        roomMetadata.flipTurnKeys.clear();
        roomMetadata.scoredWordTurnKeys.clear();
        for (const player of ctx.room.roomState.gameData!.players) {
            this.initializeScoresForPlayerId(roomMetadata, player.profile.peerId);
        }
        const currentDictionaryResource = this.getCurrentDictionaryResource(ctx);
        roomMetadata.remainingSyllables = Object.assign({}, currentDictionaryResource.metadata.syllablesCount);
    };
}
