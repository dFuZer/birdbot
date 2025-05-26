import { createHash } from "crypto";
import type WebSocket from "ws";
import type z from "zod";
import type AbstractNetworkAdapter from "../../lib/abstract/AbstractNetworkAdapter.class";
import { CommandOrEventCtx } from "../../lib/class/CommandUtils.class";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { dictionaryManifests } from "../../lib/constants/gameConstants";
import type { DictionaryId, DictionaryLessGameRules, Gamer, GameRules } from "../../lib/types/gameTypes";
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
            throw new Error("Current player is not set");
        }
        if (currentPlayer.gamerId !== ctx.room.roomState.myGamerId) return;
        const myPlayer = currentPlayer;
        const dictionaryResource = this.getCurrentDictionaryResource(ctx);
        const history = ctx.room.roomState.wordHistory;
        const prompt = ctx.room.roomState.gameData!.round.prompt;
        const ws = ctx.room.ws!;

        const isWordValid = (word: string) => {
            return word.indexOf(prompt) !== -1 && history.indexOf(word) === -1;
        };

        type WordPlacementMode = "flip" | "random";
        let mode: WordPlacementMode | null = null;

        if (myPlayer.lives < ctx.room.roomState.gameData!.rules.maxLives) {
            mode = "flip";
        } else {
            mode = "random";
        }
        if (mode === "flip") {
            const requiredLetters = ctx.room.roomState.gameData!.dictionaryManifest.bonusLetters;
            const placedLetters = myPlayer.usedLetters;
            const foundWord = this.getBestFlipWord({
                dictionaryResource,
                requiredLetters,
                placedLetters,
                isWordValid,
            });
            this.submitWord({
                word: foundWord ?? "/suicide",
                ws,
                adapter: ctx.bot.networkAdapter,
            });
        } else if (mode === "random") {
            const testList = dictionaryResource.metadata.testWords;
            for (const testWord of testList) {
                if (isWordValid(testWord.word)) {
                    this.submitWord({
                        word: testWord.word,
                        ws,
                        adapter: ctx.bot.networkAdapter,
                    });
                    return;
                }
            }
            const foundWord = this.getRandomValidWord({
                dictionary: dictionaryResource.resource,
                isWordValid,
            });
            this.submitWord({
                word: foundWord ?? "/suicide",
                ws,
                adapter: ctx.bot.networkAdapter,
            });
        }
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

    public static getApiPlayerData = (player: Gamer) => {
        return {
            accountName: player.identity.name,
            nickname: player.identity.nickname,
        } as BirdBotPlayerData;
    };

    public static handlePlayerDeath = async (ctx: EventCtx, gamerId: number) => {
        const gameRecap = BirdBotUtils.getApiGameRecap(ctx, gamerId);
        const gamer = ctx.room.roomState.roomData!.gamers.find((gamer) => gamer.id === gamerId);

        if (!gamer) {
            Logger.error({
                message: `Gamer ${gamerId} not found in room ${ctx.room.constantRoomData.roomCode}. This should never happen.`,
                path: "BirdBotUtils.class.ts",
            });
            throw new Error(
                `Gamer ${gamerId} not found in room ${ctx.room.constantRoomData.roomCode}. This should never happen.`
            );
        }
        const timeSurvived = gameRecap.diedAt - ctx.room.roomState.gameData!.round.startTimestamp;

        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;

        BirdBotUtils.registerGameRecap(gameRecap).then((data) => {
            if (!ctx.room.isHealthy() || !data) {
                return;
            }
            if (gameRecap.wordsCount === 0) {
                ctx.utils.sendChatMessage(
                    t("general.playerStats.diedNoWords", {
                        username: gamer.identity.nickname,
                        lng: l(ctx),
                    })
                );
            } else {
                const scores = BirdBotUtils.getFormattedPlayerScores(roomMetadata.scoresByGamerId[gamerId], l(ctx));
                if (data.oldXpData.level < data.newXpData.level) {
                    ctx.utils.sendChatMessage(
                        t("general.playerStats.diedLevelUp", {
                            username: gamer.identity.nickname,
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
                            username: gamer.identity.nickname,
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

    public static getApiGameRecap = (ctx: EventCtx, gamerId: number): BirdBotGameRecap => {
        const gameData = ctx.room.roomState.gameData!;

        const player = gameData.players.find((player) => player.gamerId === gamerId);
        if (!player) {
            throw new Error("Player not found");
        }
        const gamer = ctx.room.roomState.roomData!.gamers.find((gamer) => gamer.id === player.gamerId);
        if (!gamer) {
            throw new Error("Gamer not found");
        }
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        const playerScores = roomMetadata.scoresByGamerId[gamerId];
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
        const res: {
            oldXpData: ExperienceData;
            newXpData: ExperienceData;
        } | null = await this.postJsonToApi("/game-recap", gameRecap, "PUT");
        return res;
    };

    public static registerWord = async (wordData: BirdBotWordData) => {
        const res = await this.postJsonToApi("/word", wordData, "PUT");
        return res;
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
            id: Utilitary.valueToUUID(gameData.round.startTimestamp.toString()),
            lang: language,
            mode: roomMetadata.gameMode,
        } as BirdBotGameData;
    };

    public static setRoomGameMode = (ctx: CommandOrEventCtx, mode: DictionaryLessGameRules) => {
        for (const rule of Object.keys(mode)) {
            this.setRoomGameRuleIfDifferent(
                ctx,
                rule as keyof DictionaryLessGameRules,
                mode[rule as keyof DictionaryLessGameRules]
            );
        }
    };

    public static setRoomGameRuleIfDifferent = (ctx: CommandOrEventCtx, rule: keyof GameRules, value: any) => {
        if (ctx.room.roomState.gameData!.rules[rule] !== value) {
            Logger.log({
                message: `Setting rule ${rule} to value ${value}`,
                path: "BirdBotEventHandlers.ts",
            });
            ctx.room.ws!.send(ctx.bot.networkAdapter.getSetupMessage(rule, value));
        } else {
            Logger.log({
                message: `Rule ${rule} is already set to the correct value. Skipping.`,
                path: "BirdBotEventHandlers.ts",
            });
        }
    };

    public static detectRoomGameMode = (ctx: EventCtx) => {
        let foundCorrespondingGameMode = false;
        for (const gameModeKey in birdbotModeRules) {
            const gameMode = birdbotModeRules[gameModeKey as BirdBotGameMode];
            let isGameModeMatching = true;
            for (const ruleKey in gameMode) {
                type Rule = keyof typeof gameMode;
                const ruleValue = gameMode[ruleKey as Rule];
                if (ctx.room.roomState.gameData!.rules[ruleKey as Rule] !== ruleValue) {
                    isGameModeMatching = false;
                    break;
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

    public static findBestUsernameMatch = (str: string, gamers: Gamer[]): Gamer | null => {
        const perfectMatch = gamers.find((gamer) => gamer.identity.nickname === str);
        if (perfectMatch) return perfectMatch;
        const perfectCaseInsensitiveMatch = gamers.find((gamer) => gamer.identity.nickname.toLowerCase() === str.toLowerCase());
        if (perfectCaseInsensitiveMatch) return perfectCaseInsensitiveMatch;
        const startsWithMatch = gamers.find((gamer) => gamer.identity.nickname.toLowerCase().startsWith(str.toLowerCase()));
        if (startsWithMatch) return startsWithMatch;
        const includeMatch = gamers.find((gamer) => gamer.identity.nickname.toLowerCase().includes(str.toLowerCase()));
        if (includeMatch) return includeMatch;
        return null;
    };

    public static submitWord = ({ adapter, word, ws }: { adapter: AbstractNetworkAdapter; word: string; ws: WebSocket }) => {
        const typeMessage = adapter.getTypeMessage({ word });
        const submitMessage = adapter.getSubmitWordMessage();
        ws.send(typeMessage);
        ws.send(submitMessage);
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

    public static initializeScoresForPlayerId = (roomMetadata: BirdBotRoomMetadata, gamerId: number) => {
        roomMetadata.scoresByGamerId[gamerId] = {
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

    public static getCurrentRoomLanguage = (ctx: EventCtx) => {
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

    public static getCurrentDictionaryResource = (ctx: EventCtx) => {
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
        this.detectRoomGameMode(ctx);
        roomMetadata.scoresByGamerId = {};
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
        this.initializeScoresForAllPlayers(ctx);
        const currentDictionaryResource = this.getCurrentDictionaryResource(ctx);
        roomMetadata.remainingSyllables = Object.assign({}, currentDictionaryResource.metadata.syllablesCount);
        roomMetadata.wasInitialized = true;
    };

    public static initializeScoresForAllPlayers = (ctx: EventCtx) => {
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        for (const player of ctx.room.roomState.gameData!.players) {
            this.initializeScoresForPlayerId(roomMetadata, player.gamerId);
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
        roomMetadata.scoresByGamerId = {};
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
        for (const player of ctx.room.roomState.gameData!.players) {
            this.initializeScoresForPlayerId(roomMetadata, player.gamerId);
        }
        const currentDictionaryResource = this.getCurrentDictionaryResource(ctx);
        roomMetadata.remainingSyllables = Object.assign({}, currentDictionaryResource.metadata.syllablesCount);
    };
}
