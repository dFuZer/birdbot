import type { EventCtx } from "../../../lib/types/libEventTypes";
import {
    dictionaryIdToBirdbotLanguage,
    listedRecords,
    listedRecordsPerLanguage,
} from "../BirdBotConstants";
import type {
    BirdBotLanguage,
    BirdBotPlaystyle,
    BirdBotRoomMetadata,
    BirdBotSupportedDictionaryId,
    DictionaryResource,
    ListedRecordListResource,
    PlayerGameScores,
} from "../BirdBotTypes";

type SelectionInput = {
    ctx: EventCtx;
    prompt: string;
    history: readonly string[];
    lives: number;
    maxLives: number;
    bonusLetters: string;
    requiredLetters: string;
    scores: PlayerGameScores;
};

export default class BirdBotWordSelectionService {
    public static select(input: SelectionInput): string | null {
        const metadata = input.ctx.room.roomState.metadata as BirdBotRoomMetadata;
        if (metadata.humanMode) return null;

        const language = this.language(input.ctx);
        const dictionary = input.ctx.bot.getResource<DictionaryResource>(`dictionary-${language}`);
        const history = new Set(input.history);
        const valid = (word: string) => word.includes(input.prompt) && !history.has(word);
        const effectiveStyle: BirdBotPlaystyle =
            input.lives < input.maxLives || metadata.playstyle === "flips" ? "flips" : metadata.playstyle;

        if (effectiveStyle !== "flips") {
            const testWord = dictionary.metadata.testWords.find((item) => valid(item.word));
            if (testWord) return testWord.word;
        }

        const regular = () => this.random(dictionary.resource, valid);
        switch (effectiveStyle) {
            case "regular":
                return regular();
            case "flips":
                return (
                    this.best(dictionary.resource, valid, (word) =>
                        this.flipValue(
                            word,
                            dictionary.metadata.letterRarityScores,
                            input.requiredLetters,
                            input.bonusLetters,
                        ),
                    ) ?? regular()
                );
            case "alpha": {
                const letter = String.fromCharCode(97 + (input.scores.alpha % 26));
                return this.random(dictionary.resource, (word) => valid(word) && word.startsWith(letter)) ?? regular();
            }
            case "previous_syllable":
                return input.scores.previousSyllable
                    ? this.random(
                          dictionary.resource,
                          (word) => valid(word) && word.includes(input.scores.previousSyllable!),
                      ) ?? regular()
                    : regular();
            case "depleted_syllables":
                return (
                    this.best(dictionary.resource, valid, (word) =>
                        this.depletionValue(word, metadata.remainingSyllables),
                    ) ?? regular()
                );
            case "multi_syllable":
                return (
                    this.best(dictionary.resource, valid, (word) => this.countOccurrences(word, input.prompt)) ??
                    regular()
                );
            case "hyphen":
                return this.random(dictionary.resource, (word) => valid(word) && word.includes("-")) ?? regular();
            case "more_than_20_letters":
                return this.random(dictionary.resource, (word) => valid(word) && word.length >= 20) ?? regular();
            default:
                return this.selectListed(input.ctx, language, effectiveStyle, valid) ?? regular();
        }
    }

    private static language(ctx: EventCtx): BirdBotLanguage {
        const dictionaryId = ctx.room.roomState.gameData!.rules.dictionaryId as BirdBotSupportedDictionaryId;
        return dictionaryIdToBirdbotLanguage[dictionaryId];
    }

    private static selectListed(
        ctx: EventCtx,
        language: BirdBotLanguage,
        style: BirdBotPlaystyle,
        valid: (word: string) => boolean,
    ): string | null {
        if (!listedRecords.includes(style as any) || !listedRecordsPerLanguage[language].includes(style as any)) {
            return null;
        }
        const list = ctx.bot.getResource<ListedRecordListResource>(`list-${style}-${language}`);
        return this.random(list.resource, valid);
    }

    private static random(words: readonly string[], valid: (word: string) => boolean): string | null {
        if (words.length === 0) return null;
        const start = Math.floor(Math.random() * words.length);
        for (let offset = 0; offset < words.length; offset++) {
            const word = words[(start + offset) % words.length]!;
            if (valid(word)) return word;
        }
        return null;
    }

    private static best(
        words: readonly string[],
        valid: (word: string) => boolean,
        score: (word: string) => number,
    ): string | null {
        let result: string | null = null;
        let resultScore = -Infinity;
        for (const word of words) {
            if (!valid(word)) continue;
            const current = score(word);
            if (current > resultScore) {
                result = word;
                resultScore = current;
            }
        }
        return result;
    }

    private static flipValue(
        word: string,
        rarity: Record<string, number>,
        requiredLetters: string,
        placedLetters: string,
    ): number {
        const required = new Set(requiredLetters);
        const placed = new Set(placedLetters);
        const seen = new Set<string>();
        let score = 0;
        for (const letter of word) {
            if (!seen.has(letter) && required.has(letter) && !placed.has(letter)) score += rarity[letter] ?? 0;
            seen.add(letter);
        }
        return score;
    }

    private static depletionValue(word: string, remaining: Record<string, number>): number {
        let score = 0;
        for (let size = 2; size <= 3; size++) {
            for (let index = 0; index <= word.length - size; index++) {
                const syllable = word.slice(index, index + size);
                const amount = remaining[syllable];
                if (amount) score += 1 / (amount * amount);
            }
        }
        return score;
    }

    private static countOccurrences(word: string, prompt: string): number {
        let count = 0;
        for (let index = 0; index <= word.length - prompt.length; index++) {
            if (word.slice(index, index + prompt.length) === prompt) count++;
        }
        return count;
    }
}
