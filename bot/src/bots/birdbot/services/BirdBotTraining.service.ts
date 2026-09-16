import type { CommandOrEventCtx } from "../../../lib/class/CommandUtils.class";
import type { EventCtx } from "../../../lib/types/libEventTypes";
import { dictionaryIdToBirdbotLanguage } from "../BirdBotConstants";
import type {
    BirdBotSupportedDictionaryId,
    BirdBotTrainingCondition,
    BirdBotTrainingListState,
    BirdBotTrainingSource,
    BirdBotTrainingState,
    DictionaryResource,
    ListedRecordListResource,
    PlayerGameScores,
} from "../BirdBotTypes";
import BirdBotUtils from "../BirdBotUtils.class";
import { l, t } from "../texts/BirdBotTextUtils";
import BirdBotGameplayStateService from "./BirdBotGameplayState.service";
import BirdBotRegexService from "./BirdBotRegex.service";

const LOW_SUB_WORD_LIMIT = 8;

export default class BirdBotTrainingService {
    public static set(ctx: CommandOrEventCtx, state: BirdBotTrainingState | null): void {
        BirdBotGameplayStateService.metadata(ctx).training = state;
    }

    public static resetStats(ctx: CommandOrEventCtx, authId: string | null): void {
        const training = BirdBotGameplayStateService.metadata(ctx).training;
        if (!training?.list || authId !== training.creatorAuthId) return;
        training.list.successes = 0;
        training.list.attempts = 0;
    }

    public static evaluateCreatorWord(ctx: EventCtx, authId: string | null, word: string, prompt: string): string | null {
        const training = BirdBotGameplayStateService.metadata(ctx).training;
        if (!training?.list || authId !== training.creatorAuthId) return null;

        const list = training.list;
        const scores = this.creatorScores(ctx);
        const trainDict = this.words(ctx, list.source);
        const trainSet = new Set(trainDict);
        const compiled = BirdBotRegexService.compileDetailed(list.regexSources, true);
        if (!compiled.ok) return null;
        const regexes = compiled.regexes;
        const valid = this.matches(ctx, list, word, prompt, scores, trainSet, regexes);
        const suggestions = this.suggestions(ctx, list, prompt, scores, trainDict, trainSet, regexes);
        if (valid) {
            list.successes++;
            list.attempts++;
            return t("parity.gameplay.trainingSuccess", {
                successes: list.successes,
                attempts: list.attempts,
                percentage: this.percentage(list),
                lng: l(ctx),
            });
        }
        if (suggestions.length === 0) return null;
        list.attempts++;
        return t("parity.gameplay.trainingFail", {
            successes: list.successes,
            attempts: list.attempts,
            percentage: this.percentage(list),
            suggestions: suggestions.join(", "),
            prompt: prompt.toUpperCase(),
            lng: l(ctx),
        });
    }

    public static countMatches(ctx: CommandOrEventCtx, state: Omit<BirdBotTrainingListState, "successes" | "attempts">): number {
        const compiled = BirdBotRegexService.compileDetailed(state.regexSources, true);
        if (!compiled.ok) return -1;
        return this.words(ctx, state.source).filter(
            (word) => compiled.regexes.every((regex) => this.test(regex, word)) && this.staticConditions(state.conditions, word),
        ).length;
    }

    public static sourceSize(ctx: CommandOrEventCtx, source: BirdBotTrainingSource): number {
        return this.words(ctx, source).length;
    }

    private static suggestions(
        ctx: EventCtx,
        state: BirdBotTrainingListState,
        prompt: string,
        scores: PlayerGameScores,
        trainDict: string[],
        trainSet: Set<string>,
        regexes: RegExp[],
    ): string[] {
        const availableWords: string[] = [];

        const checkWordValidity = (candidate: string): boolean =>
            this.matches(ctx, state, candidate, prompt, scores, trainSet, regexes);

        if (state.sort === "shuffle") {
            const start = Math.floor(Math.random() * trainDict.length);
            for (let index = start; index < trainDict.length; index++) {
                if (availableWords.length > 2) break;
                const word = trainDict[index]!;
                if (checkWordValidity(word)) availableWords.push(word.toUpperCase());
            }
            for (let index = 0; index < start; index++) {
                if (availableWords.length > 2) break;
                const word = trainDict[index]!;
                if (checkWordValidity(word)) availableWords.push(word.toUpperCase());
            }
            return availableWords;
        }

        for (const word of trainDict) {
            if (checkWordValidity(word)) availableWords.push(word);
        }

        if (state.sort === "sn") {
            const remaining = BirdBotGameplayStateService.metadata(ctx).remainingSyllables;
            availableWords.sort((a, b) => this.snValue(b, remaining) - this.snValue(a, remaining));
            return availableWords.slice(0, 3).map((word) => word.toUpperCase());
        }
        if (state.sort === "ms") {
            return availableWords
                .map((word) => [word, this.occurrences(word, prompt)] as const)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([word, count]) => `${word.toUpperCase()} (${count})`);
        }
        if (state.sort === "l") {
            availableWords.sort((a, b) => b.length - a.length);
            return availableWords.slice(0, 3).map((word) => word.toUpperCase());
        }
        availableWords.sort((a, b) => a.length - b.length);
        return availableWords.slice(0, 3).map((word) => word.toUpperCase());
    }

    private static matches(
        ctx: CommandOrEventCtx,
        state: Omit<BirdBotTrainingListState, "successes" | "attempts">,
        word: string,
        prompt: string,
        scores: PlayerGameScores,
        trainSet: Set<string>,
        regexes: RegExp[],
    ): boolean {
        if (!trainSet.has(word) || !word.includes(prompt) || ctx.room.roomState.wordHistory.includes(word)) return false;
        if (!regexes.every((regex) => this.test(regex, word))) return false;
        return state.conditions.every((condition) => this.condition(condition, word, prompt, scores));
    }

    private static words(ctx: CommandOrEventCtx, source: BirdBotTrainingSource): string[] {
        const language =
            dictionaryIdToBirdbotLanguage[
                ctx.room.roomState.gameData!.rules.dictionaryId as BirdBotSupportedDictionaryId
            ];
        const dictionary = ctx.bot.getResource<DictionaryResource>(`dictionary-${language}`).resource;
        if (source === "dictionary") return dictionary;
        if (source === "low_sub_words") {
            const syllablesCount = ctx.bot.getResource<DictionaryResource>(`dictionary-${language}`).metadata.syllablesCount;
            return dictionary.filter((word) => {
                const syllables = BirdBotUtils.splitWordIntoSyllables(word);
                return Object.keys(syllables).some((syllable) => (syllablesCount[syllable] ?? Infinity) <= LOW_SUB_WORD_LIMIT);
            });
        }
        return ctx.bot.getResource<ListedRecordListResource>(`list-${source}-${language}`).resource;
    }

    private static creatorScores(ctx: EventCtx): PlayerGameScores {
        const metadata = BirdBotGameplayStateService.metadata(ctx);
        const creator = ctx.room.roomState.roomData!.chatters.find(
            (chatter) => chatter.authId === ctx.room.constantRoomData.roomCreatorAuthId,
        );
        return creator && metadata.scoresByPeerId[creator.peerId]
            ? metadata.scoresByPeerId[creator.peerId]!
            : ({
                  alpha: 0,
                  previousSyllable: null,
              } as PlayerGameScores);
    }

    private static staticConditions(conditions: readonly BirdBotTrainingCondition[], word: string): boolean {
        return conditions.every((condition) => {
            if (condition.type === "hyphen") return word.includes("-");
            if (condition.type === "more_than_20_letters") return word.length >= 20;
            return true;
        });
    }

    private static condition(
        condition: BirdBotTrainingCondition,
        word: string,
        prompt: string,
        scores: PlayerGameScores,
    ): boolean {
        if (condition.type === "alpha") return word.startsWith(String.fromCharCode(97 + (scores.alpha % 26)));
        if (condition.type === "previous_syllable") return scores.previousSyllable !== null && word.includes(scores.previousSyllable);
        if (condition.type === "multi_syllable") return this.occurrences(word, prompt) > 1;
        if (condition.type === "hyphen") return word.includes("-");
        return word.length >= 20;
    }

    private static test(regex: RegExp, word: string): boolean {
        regex.lastIndex = 0;
        return regex.test(word);
    }

    private static occurrences(word: string, prompt: string): number {
        let count = 0;
        for (let index = 0; index <= word.length - prompt.length; index++) {
            if (word.slice(index, index + prompt.length) === prompt) count++;
        }
        return count;
    }

    private static snValue(word: string, remaining: Record<string, number>): number {
        const syllables = BirdBotUtils.splitWordIntoSyllables(word);
        let score = 0;
        for (const syllable in syllables) {
            score += 1 / ((remaining[syllable] || 2) - syllables[syllable]! + 1) ** 2;
        }
        return score;
    }

    private static percentage(state: Pick<BirdBotTrainingListState, "successes" | "attempts">): string {
        return state.attempts === 0 ? "0.00" : ((state.successes * 100) / state.attempts).toFixed(2);
    }
}
