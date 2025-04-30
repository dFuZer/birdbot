import type WebSocket from "ws";
import type z from "zod";
import type NetworkAdapter from "../../lib/abstract/NetworkAdapter.abstract.class";
import { CommandOrEventCtx } from "../../lib/class/CommandUtils.class";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import { dictionaryManifests } from "../../lib/constants/gameConstants";
import type { DictionaryId, DictionaryLessGameRules, Gamer, GameRules } from "../../lib/types/gameTypes";
import type { BotEventHandlerFn, EventCtx } from "../../lib/types/libEventTypes";
import { birdbotModeRules, dictionaryIdToBirdbotLanguage, recordsUtils } from "./BirdBotConstants";
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
    PlayerGameScores,
} from "./BirdBotTypes";

export type ApiResponseAllRecords = {
    message: string;
    bestScores: {
        player_id: string;
        player_username: string;
        score: number;
        record_type: BirdBotRecordType;
    }[];
};

export type ApiResponseBestScoresSpecificRecord = {
    message: string;
    bestScores: { player_id: string; player_username: string; score: number; rank: number }[];
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
            this.submitWord({ word: foundWord ?? "💥", ws, adapter: ctx.bot.networkAdapter });
        } else if (mode === "random") {
            const foundWord = this.getRandomValidWord({ dictionary: dictionaryResource.resource, isWordValid });
            this.submitWord({ word: foundWord ?? "💥", ws, adapter: ctx.bot.networkAdapter });
        }
    };

    public static getTopFlipWords = (dictionary: string[], letterRarityScores: Record<string, number>, dictionaryId: DictionaryId, n: number): { word: string; score: number }[] => {
        const necessaryLetters = dictionaryManifests[dictionaryId].bonusLetters;
        return dictionary
            .map((word) => {
                const score = this.evaluateFlipWord(word, letterRarityScores, necessaryLetters, "");
                return { word, score };
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

    public static getTopSnWords = (dictionary: string[], syllablesCount: Record<string, number>, n: number): { word: string; score: number }[] => {
        return dictionary
            .map((word) => {
                const score = this.evaluateSnWord(word, syllablesCount);
                return { word, score };
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
        if (gameRecap.wordsCount < 10) return;
        await BirdBotUtils.registerGameRecap(gameRecap);
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
            wordsWithoutDeathCount: playerScores.currentWordsWithoutDeath,
            previousSyllablesCount: playerScores.previousSyllableScore,
            multiSyllablesCount: playerScores.multiSyllables,
            hyphenWordsCount: playerScores.hyphenWords,
            moreThan20LettersWordsCount: playerScores.moreThan20LettersWords,
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
        const res = await this.postJsonToApi("/add-game-recap", gameRecap);
        return res;
    };

    public static registerWord = async (wordData: BirdBotWordData) => {
        const res = await this.postJsonToApi("/add-word", wordData);
        return res;
    };

    public static registerGame = async (gameData: BirdBotGameData) => {
        const res = await this.postJsonToApi("/add-game", gameData);
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
            this.setRoomGameRuleIfDifferent(ctx, rule as keyof DictionaryLessGameRules, mode[rule as keyof DictionaryLessGameRules]);
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
                    ctx.utils.sendChatMessage(`Game mode set to ${gameModeKey}.`);
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

    public static getJsonFromApi = async <T>(url: string): Promise<T | null> => {
        const logError = (error: any) => {
            Logger.error({
                message: `Failed to fetch ${url}`,
                path: "BirdBotUtils.class.ts",
                error,
            });
        };
        try {
            const res = await fetch(`${API_URL}${url}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`,
                },
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

    public static postJsonToApi = async <T>(url: string, body: any): Promise<T | null> => {
        const logError = (error: any) => {
            Logger.error({
                message: `Failed to post to ${url}`,
                path: "BirdBotUtils.class.ts",
                error,
                json: body,
            });
        };
        try {
            const res = await fetch(`${API_URL}${url}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`,
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

    public static getRecordsFromApi = async ({ language, gameMode, recordType, page }: { language: BirdBotLanguage; gameMode: BirdBotGameMode; recordType?: BirdBotRecordType; page?: number }) => {
        if (recordType) {
            return await this.getJsonFromApi<ApiResponseBestScoresSpecificRecord>(`/get-records?lang=${language}&mode=${gameMode}&page=${page ?? 1}&perPage=5&record=${recordType}`);
        } else {
            return await this.getJsonFromApi<ApiResponseAllRecords>(`/get-records?lang=${language}&mode=${gameMode}`);
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

    public static submitWord = ({ adapter, word, ws }: { adapter: NetworkAdapter; word: string; ws: WebSocket }) => {
        const typeMessage = adapter.getTypeMessage({ word });
        const submitMessage = adapter.getSubmitWordMessage();
        ws.send(typeMessage);
        ws.send(submitMessage);
    };

    public static getRandomValidWord = ({ dictionary, isWordValid }: { dictionary: string[]; isWordValid: (word: string) => boolean }): string | null => {
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

    public static evaluateFlipWord = (word: string, letterRarityScores: Record<string, number>, requiredLetters: string, placedLetters: string) => {
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

    public static getLetterRarityScores = (dictionary: string[], dictionaryId: DictionaryId) => {
        const letterRarityScores: Record<string, number> = {};
        const dictionaryManifest = dictionaryManifests[dictionaryId];
        // Count letters
        for (const word of dictionary) {
            for (const letter of word) {
                letterRarityScores[letter] = (letterRarityScores[letter] ?? 0) + 1;
            }
        }
        // Remove letters that are not in the bonus letters
        for (const letter in letterRarityScores) {
            if (!dictionaryManifest.bonusLetters.includes(letter)) {
                delete letterRarityScores[letter];
            }
        }
        // Normalize letter counts
        let minLetters = Infinity;
        for (const letter in letterRarityScores) {
            if (letterRarityScores[letter]! < minLetters) {
                minLetters = letterRarityScores[letter]!;
            }
        }
        let minScore = Infinity;
        for (const letter in letterRarityScores) {
            letterRarityScores[letter] = letterRarityScores[letter]! / minLetters;
            letterRarityScores[letter] = 1 / letterRarityScores[letter]!;
            if (letterRarityScores[letter]! < minScore) {
                minScore = letterRarityScores[letter]!;
            }
        }
        // Normalize scores
        for (const letter in letterRarityScores) {
            letterRarityScores[letter] = letterRarityScores[letter]! / minScore;
            letterRarityScores[letter] = Math.pow(letterRarityScores[letter]!, 0.5);
            letterRarityScores[letter] = Math.round(letterRarityScores[letter]! * 100) / 100;
        }
        return letterRarityScores;
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
        };
    };

    public static getSyllablesCount = (dictionary: string[]) => {
        const syllablesCount: Record<string, number> = {};
        for (const word of dictionary) {
            const syllables = this.splitWordIntoSyllables(word);
            for (const syllable in syllables) {
                syllablesCount[syllable] = (syllablesCount[syllable] ?? 0) + syllables[syllable];
            }
        }
        return syllablesCount;
    };

    public static splitWordIntoValidSubwords = (word: string) => {
        return word.split(/['-]/).filter((x) => x.length > 1);
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

    public static getCurrentDictionaryResource = (ctx: EventCtx) => {
        const roomLanguage = ctx.room.roomState.gameData!.rules.dictionaryId;
        return ctx.bot.getResource<DictionaryResource>(`dictionary-${roomLanguage}`);
    };

    public static setupRoomMetadata = (ctx: EventCtx) => {
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        this.detectRoomGameMode(ctx);
        roomMetadata.scoresByGamerId = {};
        const currentDictionaryResource = this.getCurrentDictionaryResource(ctx);
        roomMetadata.remainingSyllables = Object.assign({}, currentDictionaryResource.metadata.syllablesCount);
    };

    public static initializeScoresForAllPlayers = (ctx: EventCtx) => {
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        for (const player of ctx.room.roomState.gameData!.players) {
            this.initializeScoresForPlayerId(roomMetadata, player.gamerId);
        }
    };

    public static getFormattedPlayerScores = (playerStats: PlayerGameScores) => {
        const scores: [BirdBotRecordType, number, string][] = [
            ["word", playerStats.words, recordsUtils.word.specificScoreDisplayStringGenerator(playerStats.words)],
            ["flips", playerStats.flips, recordsUtils.flips.specificScoreDisplayStringGenerator(playerStats.flips)],
            ["depleted_syllables", playerStats.depletedSyllables, recordsUtils.depleted_syllables.specificScoreDisplayStringGenerator(playerStats.depletedSyllables)],
            ["alpha", playerStats.alpha, recordsUtils.alpha.specificScoreDisplayStringGenerator(playerStats.alpha)],
            ["no_death", playerStats.maxWordsWithoutDeath, recordsUtils.no_death.specificScoreDisplayStringGenerator(playerStats.maxWordsWithoutDeath)],
            ["multi_syllable", playerStats.multiSyllables, recordsUtils.multi_syllable.specificScoreDisplayStringGenerator(playerStats.multiSyllables)],
            ["previous_syllable", playerStats.previousSyllableScore, recordsUtils.previous_syllable.specificScoreDisplayStringGenerator(playerStats.previousSyllableScore)],
            ["hyphen", playerStats.hyphenWords, recordsUtils.hyphen.specificScoreDisplayStringGenerator(playerStats.hyphenWords)],
            ["more_than_20_letters", playerStats.moreThan20LettersWords, recordsUtils.more_than_20_letters.specificScoreDisplayStringGenerator(playerStats.moreThan20LettersWords)],
        ];
        return scores
            .filter((x) => x[1] !== 0)
            .sort((a, b) => recordsUtils[a[0]].order - recordsUtils[b[0]].order)
            .map((x) => x[2])
            .join(" — ");
    };

    public static resetRoomMetadata = (ctx: EventCtx) => {
        const roomMetadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        roomMetadata.scoresByGamerId = {};
        for (const player of ctx.room.roomState.gameData!.players) {
            this.initializeScoresForPlayerId(roomMetadata, player.gamerId);
        }
        const currentDictionaryResource = this.getCurrentDictionaryResource(ctx);
        roomMetadata.remainingSyllables = Object.assign({}, currentDictionaryResource.metadata.syllablesCount);
    };
}
