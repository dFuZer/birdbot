import assert from "node:assert/strict";
import test from "node:test";
import {
    getHighestSnCandidate,
    getHighestSnValueForSyllable,
    getPromptMemoryChain,
    isShiritoriWord,
    nextComebackState,
    PROMPT_MEMORY_SIZE,
    rememberPrompt,
} from "./BirdBotRecordScoring";

test("isShiritoriWord never scores a player's first word", () => {
    assert.equal(isShiritoriWord(null, "elephant"), false);
});

test("isShiritoriWord matches the last letter of the previous word to the first letter of the current one", () => {
    assert.equal(isShiritoriWord("table", "elephant"), true);
    assert.equal(isShiritoriWord("table", "tiger"), false);
});

test("isShiritoriWord ignores trailing and leading punctuation", () => {
    assert.equal(isShiritoriWord("rock-n-roll", "lamp"), true);
    assert.equal(isShiritoriWord("aujourd'hui", "-ici"), true);
    assert.equal(isShiritoriWord("'", "apple"), false);
});

const dictionaryWords = ["abab", "cab", "cdab", "code", "cdcd", "axle", "pixel"];

test("getHighestSnValueForSyllable counts words containing the syllable, not occurrences", () => {
    assert.equal(getHighestSnValueForSyllable("ab", dictionaryWords), 3);
    assert.equal(getHighestSnValueForSyllable("xl", dictionaryWords), 1);
    assert.equal(getHighestSnValueForSyllable("zz", dictionaryWords), 0);
});

test("getHighestSnCandidate is zero when the word depleted nothing", () => {
    assert.equal(getHighestSnCandidate([], dictionaryWords), 0);
});

test("getHighestSnCandidate keeps the largest depleted syllable instead of summing", () => {
    assert.equal(getHighestSnCandidate(["xl"], dictionaryWords), 1);
    assert.equal(getHighestSnCandidate(["xl", "ab", "cd"], dictionaryWords), 3);
});

test("rememberPrompt keeps the most recent distinct prompts first", () => {
    let history: string[] = [];
    for (const prompt of ["ab", "cd", "ef", "cd"]) history = rememberPrompt(history, prompt);
    assert.deepEqual(history, ["cd", "ef", "ab"]);
});

test("rememberPrompt caps the memory size", () => {
    let history: string[] = [];
    for (let i = 0; i < PROMPT_MEMORY_SIZE + 5; i++) history = rememberPrompt(history, `p${i}`);
    assert.equal(history.length, PROMPT_MEMORY_SIZE);
    assert.equal(history[0], `p${PROMPT_MEMORY_SIZE + 4}`);
});

test("getPromptMemoryChain stops at the first missing prompt", () => {
    const history = ["an", "ti", "on"];
    assert.deepEqual(getPromptMemoryChain("antition", history, "xx"), ["an", "ti", "on"]);
    assert.deepEqual(getPromptMemoryChain("anon", history, "xx"), ["an"]);
    assert.deepEqual(getPromptMemoryChain("tion", history, "xx"), []);
});

test("getPromptMemoryChain skips the current prompt", () => {
    assert.deepEqual(getPromptMemoryChain("anti", ["ti", "an"], "ti"), ["an"]);
});

test("nextComebackState scores a clean 1 -> 2 -> 3 climb", () => {
    let state = nextComebackState(false, 1, 2);
    assert.deepEqual(state, { ascending: true, scored: false });
    state = nextComebackState(state.ascending, 2, 3);
    assert.deepEqual(state, { ascending: false, scored: true });
});

test("nextComebackState ignores 2 -> 3 without a climb from 1", () => {
    assert.deepEqual(nextComebackState(false, 2, 3), { ascending: false, scored: false });
});

test("nextComebackState resets when a life is lost during the climb", () => {
    let state = nextComebackState(false, 1, 2);
    state = nextComebackState(state.ascending, 2, 1);
    assert.equal(state.ascending, false);
    state = nextComebackState(state.ascending, 1, 2);
    state = nextComebackState(state.ascending, 2, 3);
    assert.equal(state.scored, true);
});

test("nextComebackState keeps the climb when a completion grants no life", () => {
    const state = nextComebackState(true, 2, 2);
    assert.deepEqual(state, { ascending: true, scored: false });
});
