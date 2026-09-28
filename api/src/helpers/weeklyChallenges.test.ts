import assert from "node:assert/strict";
import { test } from "node:test";
import {
    buildWeeklyChallengeConfig,
    defaultBonusAlphabet,
    isBetterResult,
    kindForSequence,
    rulesFingerprint,
    startOfUtcWeek,
    thirtyOfALetterTarget,
    WEEKLY_CHALLENGE_ROTATION,
} from "./weeklyChallenges";

test("weeks start on Monday 00:00 UTC", () => {
    assert.equal(startOfUtcWeek(new Date("2026-09-27T23:59:59Z")).toISOString(), "2026-09-21T00:00:00.000Z");
    assert.equal(startOfUtcWeek(new Date("2026-09-28T00:00:00Z")).toISOString(), "2026-09-28T00:00:00.000Z");
    assert.equal(startOfUtcWeek(new Date("2026-09-30T12:00:00Z")).toISOString(), "2026-09-28T00:00:00.000Z");
});

test("rotation starts with Thirty of a Letter and follows the documented order", () => {
    assert.deepEqual(
        Array.from({ length: 8 }, (_, sequence) => kindForSequence(sequence)),
        [...WEEKLY_CHALLENGE_ROTATION, "THIRTY_OF_A_LETTER"],
    );
});

test("Thirty of a Letter walks each language pool in order", () => {
    assert.deepEqual(
        [0, 7, 14, 21, 28].map((sequence) => thirtyOfALetterTarget("en", sequence)),
        ["q", "j", "x", "q", "j"],
    );
    assert.equal(thirtyOfALetterTarget("fr", 7), "k");
    const config = buildWeeklyChallengeConfig(7);
    const alphabet = config.languages.fr.rules.customBonusAlphabet;
    assert.equal(alphabet.k, 30);
    assert.equal(Object.keys(alphabet).filter((letter) => alphabet[letter] !== 0).length, 1);
    assert.equal(config.languages.fr.rules.startingLives, 3);
});

test("challenge rule profiles match the specification", () => {
    const sprint = buildWeeklyChallengeConfig(1);
    assert.equal(sprint.languages.en.rules.minTurnDuration, 7);
    assert.equal(sprint.languages.en.rules.customPromptDifficulty, 300);
    assert.deepEqual(sprint.objective, { type: "prompt_memory", target: 4 });

    const alpha = buildWeeklyChallengeConfig(2);
    assert.ok(Object.keys(alpha.languages.de.rules.customBonusAlphabet).every((l) => alpha.languages.de.rules.customBonusAlphabet[l] === 2));
    assert.equal(alpha.languages.de.rules.startingLives, 2);

    const fivefold = buildWeeklyChallengeConfig(3);
    assert.equal(Object.keys(fivefold.languages.en.rules.customBonusAlphabet).length, 26);
    assert.deepEqual(fivefold.ranking.secondary, { metric: "elapsed_ms", order: "asc" });

    const blitz = buildWeeklyChallengeConfig(4);
    assert.equal(blitz.baseMode, "blitz");
    assert.equal(blitz.languages.brpt.rules.dictionaryId, "pt-BR");
    assert.deepEqual(blitz.languages.brpt.rules.customBonusAlphabet, defaultBonusAlphabet("brpt"));

    assert.equal(buildWeeklyChallengeConfig(5).languages.en.rules.customPromptDifficulty, -50);
    const sub500 = buildWeeklyChallengeConfig(6);
    assert.equal(sub500.languages.en.rules.customPromptDifficulty, -500);
    assert.deepEqual(sub500.ranking.primary, { metric: "flips", order: "desc" });
});

test("fingerprint is stable, ignores missing zero letters and matches the bot vector", () => {
    const rules = buildWeeklyChallengeConfig(4).languages.en.rules;
    const sparse = { ...rules, customBonusAlphabet: { ...rules.customBonusAlphabet } };
    delete sparse.customBonusAlphabet.x;
    assert.equal(rulesFingerprint(sparse), rulesFingerprint(rules));
    assert.notEqual(rulesFingerprint({ ...rules, maxLives: 4 }), rulesFingerprint(rules));
    // Shared vector with bot/src/bots/birdbot/BirdBotWeeklyChallenge.test.ts.
    assert.equal(rulesFingerprint(rules), "8ed3e56159f14708aa83c77a7615087c9cddbcbe69b7be30b9a127bfe4a2850a");
});

test("ranking comparisons respect metric direction and shared ties", () => {
    const time = buildWeeklyChallengeConfig(0).ranking;
    assert.equal(isBetterResult(time, { primary: 900, secondary: null }, { primary: 1000, secondary: null }), true);
    assert.equal(isBetterResult(time, { primary: 1000, secondary: null }, { primary: 1000, secondary: null }), false);

    const fivefold = buildWeeklyChallengeConfig(3).ranking;
    assert.equal(isBetterResult(fivefold, { primary: 40, secondary: 9000 }, { primary: 40, secondary: 9500 }), true);
    assert.equal(isBetterResult(fivefold, { primary: 41, secondary: 1 }, { primary: 40, secondary: 9500 }), false);

    const survival = buildWeeklyChallengeConfig(4).ranking;
    assert.equal(isBetterResult(survival, { primary: 120, secondary: null }, { primary: 100, secondary: null }), true);
});
