import type { CommandOrEventCtx } from "../../../lib/class/CommandUtils.class";
import type { EventCtx } from "../../../lib/types/libEventTypes";
import { dictionaryIdToBirdbotLanguage } from "../BirdBotConstants";
import type {
    BirdBotSupportedDictionaryId,
    BirdBotTrainingCondition,
    BirdBotTrainingState,
    DictionaryResource,
    ListedRecordListResource,
    PlayerGameScores,
} from "../BirdBotTypes";
import BirdBotGameplayStateService from "./BirdBotGameplayState.service";
import BirdBotRegexService from "./BirdBotRegex.service";

export default class BirdBotTrainingService {
    public static set(ctx: CommandOrEventCtx, state: BirdBotTrainingState | null): void {
        BirdBotGameplayStateService.metadata(ctx).training = state;
    }

    public static evaluateCreatorWord(ctx: EventCtx, authId: string | null, word: string, prompt: string): string | null {
        const training = BirdBotGameplayStateService.metadata(ctx).training;
        if (!training || authId !== training.creatorAuthId) return null;

        const scores = this.creatorScores(ctx);
        const valid = this.matches(ctx, training, word, prompt, scores);
        const suggestions = this.suggestions(ctx, training, prompt, scores);
        if (valid) {
            training.successes++;
            training.attempts++;
            return `Training: ${training.successes}/${training.attempts} correct (${this.percentage(training)}%).`;
        }
        if (suggestions.length === 0) return null;
        training.attempts++;
        return `Training: ${training.successes}/${training.attempts} correct (${this.percentage(training)}%). Try ${suggestions
            .map((item) => item.toUpperCase())
            .join(", ")} for ${prompt.toUpperCase()}.`;
    }

    public static countMatches(ctx: CommandOrEventCtx, state: BirdBotTrainingState): number {
        const regexes = BirdBotRegexService.compile(state.regexSources);
        if (regexes === null) return -1;
        return this.words(ctx, state).filter(
            (word) => regexes.every((regex) => this.test(regex, word)) && this.staticConditions(state.conditions, word),
        ).length;
    }

    private static suggestions(
        ctx: EventCtx,
        state: BirdBotTrainingState,
        prompt: string,
        scores: PlayerGameScores,
    ): string[] {
        const candidates = this.words(ctx, state).filter((word) => this.matches(ctx, state, word, prompt, scores));
        if (state.sort === "depleted_syllables") {
            const remaining = BirdBotGameplayStateService.metadata(ctx).remainingSyllables;
            candidates.sort((a, b) => this.depletionValue(b, remaining) - this.depletionValue(a, remaining));
        } else if (state.sort === "multi_syllable") {
            candidates.sort((a, b) => this.occurrences(b, prompt) - this.occurrences(a, prompt));
        } else if (state.sort === "longest") {
            candidates.sort((a, b) => b.length - a.length);
        } else if (state.sort === "shortest") {
            candidates.sort((a, b) => a.length - b.length);
        } else {
            candidates.sort(() => Math.random() - 0.5);
        }
        return candidates.slice(0, 3);
    }

    private static matches(
        ctx: CommandOrEventCtx,
        state: BirdBotTrainingState,
        word: string,
        prompt: string,
        scores: PlayerGameScores,
    ): boolean {
        if (!word.includes(prompt) || ctx.room.roomState.wordHistory.includes(word)) return false;
        const regexes = BirdBotRegexService.compile(state.regexSources);
        if (regexes === null || !regexes.every((regex) => this.test(regex, word))) return false;
        return state.conditions.every((condition) => this.condition(condition, word, prompt, scores));
    }

    private static words(ctx: CommandOrEventCtx, state: BirdBotTrainingState): string[] {
        const language =
            dictionaryIdToBirdbotLanguage[
                ctx.room.roomState.gameData!.rules.dictionaryId as BirdBotSupportedDictionaryId
            ];
        if (state.source === "dictionary") {
            return ctx.bot.getResource<DictionaryResource>(`dictionary-${language}`).resource;
        }
        return ctx.bot.getResource<ListedRecordListResource>(`list-${state.source}-${language}`).resource;
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
        if (condition.type === "previous_syllable")
            return scores.previousSyllable !== null && word.includes(scores.previousSyllable);
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

    private static depletionValue(word: string, remaining: Record<string, number>): number {
        let score = 0;
        for (let length = 2; length <= 3; length++) {
            for (let index = 0; index <= word.length - length; index++) {
                const amount = remaining[word.slice(index, index + length)];
                if (amount) score += 1 / (amount * amount);
            }
        }
        return score;
    }

    private static percentage(state: BirdBotTrainingState): string {
        return state.attempts === 0 ? "0.00" : ((state.successes * 100) / state.attempts).toFixed(2);
    }
}
