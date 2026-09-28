const LETTER_REGEX = /[a-z]/;

function firstLetter(word: string): string | null {
    for (const char of word) {
        if (LETTER_REGEX.test(char)) return char;
    }
    return null;
}

function lastLetter(word: string): string | null {
    for (let i = word.length - 1; i >= 0; i--) {
        if (LETTER_REGEX.test(word[i]!)) return word[i]!;
    }
    return null;
}

export function isShiritoriWord(previousWord: string | null, word: string): boolean {
    if (previousWord === null) return false;
    const expectedLetter = lastLetter(previousWord);
    return expectedLetter !== null && firstLetter(word) === expectedLetter;
}

/** Highest SN value earned by depleting `syllable`: the number of dictionary words containing it. */
export function getHighestSnValueForSyllable(syllable: string, dictionaryWords: readonly string[]): number {
    let count = 0;
    for (const word of dictionaryWords) {
        if (word.includes(syllable)) count++;
    }
    return count;
}

export function getHighestSnCandidate(depletedSyllables: readonly string[], dictionaryWords: readonly string[]): number {
    let candidate = 0;
    for (const syllable of depletedSyllables) {
        candidate = Math.max(candidate, getHighestSnValueForSyllable(syllable, dictionaryWords));
    }
    return candidate;
}

export const PROMPT_MEMORY_SIZE = 15;
export const COMEBACK_TARGET_LIVES = 3;

/** Most recent prompt first; a repeated prompt moves back to the front instead of taking a second slot. */
export function rememberPrompt(history: readonly string[], prompt: string): string[] {
    if (!prompt) return [...history];
    return [prompt, ...history.filter((item) => item !== prompt)].slice(0, PROMPT_MEMORY_SIZE);
}

/**
 * Remembered prompts placed in `word`, newest first, stopping at the first one that is missing.
 * The current prompt is skipped because every accepted word contains it.
 */
export function getPromptMemoryChain(word: string, history: readonly string[], currentPrompt: string): string[] {
    const chain: string[] = [];
    for (const prompt of history) {
        if (prompt === currentPrompt) continue;
        if (!word.includes(prompt)) break;
        chain.push(prompt);
    }
    return chain;
}

/** Newest syllable first, so the next prompt-memory word can be read straight from chat. */
export function formatPromptMemorySyllables(currentPrompt: string, chain: readonly string[]): string {
    return [currentPrompt, ...chain].join(" + ").toUpperCase();
}

/**
 * A comeback is a clean climb from 1 to 3 lives: two consecutive life gains with no life lost in between.
 * `ascending` is true once the player has gained 1 -> 2 and has not lost a life since.
 */
export function nextComebackState(
    ascending: boolean,
    previousLives: number,
    newLives: number,
): { ascending: boolean; scored: boolean } {
    if (newLives < previousLives) return { ascending: false, scored: false };
    if (newLives === previousLives) return { ascending, scored: false };
    if (previousLives === COMEBACK_TARGET_LIVES - 2 && newLives === COMEBACK_TARGET_LIVES - 1) {
        return { ascending: true, scored: false };
    }
    if (ascending && previousLives === COMEBACK_TARGET_LIVES - 1 && newLives === COMEBACK_TARGET_LIVES) {
        return { ascending: false, scored: true };
    }
    return { ascending: false, scored: false };
}
