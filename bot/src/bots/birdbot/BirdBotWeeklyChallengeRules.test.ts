import assert from "node:assert/strict";
import test from "node:test";
import "../../testEnv";
import { defaultBonusAlphabetsByDictionaryId } from "../../lib/constants/gameConstants";
import { birdbotModeRules } from "./BirdBotConstants";
import {
    isInstantObjectiveReached,
    matchWeeklyChallenge,
    selectActiveWeeklyChallenge,
    weeklyChallengeResultValues,
    weeklyChallengeRulesFingerprint,
    type WeeklyChallengePeriod,
} from "./BirdBotWeeklyChallengeRules";

const blitzEnglishRules = {
    ...birdbotModeRules.blitz,
    dictionaryId: "en",
    customBonusAlphabet: { ...defaultBonusAlphabetsByDictionaryId.en },
};

function period(id: string, startsAt: number, endsAt: number): WeeklyChallengePeriod {
    return {
        id,
        sequence: 4,
        kind: "BLITZ_SURVIVAL",
        startsAt,
        endsAt,
        configVersion: 1,
        config: {
            version: 1,
            kind: "BLITZ_SURVIVAL",
            baseMode: "blitz",
            objective: { type: "survival", target: null },
            ranking: { primary: { metric: "words", order: "desc" }, secondary: null },
            languages: {
                en: {
                    rules: { ...blitzEnglishRules, promptDifficulty: "custom" },
                    fingerprint: weeklyChallengeRulesFingerprint(blitzEnglishRules),
                    targetLetter: null,
                },
            },
        },
    };
}

test("fingerprint matches the API vector for exact Blitz English rules", () => {
    // Shared vector with api/src/helpers/weeklyChallenges.test.ts.
    assert.equal(
        weeklyChallengeRulesFingerprint(blitzEnglishRules),
        "8ed3e56159f14708aa83c77a7615087c9cddbcbe69b7be30b9a127bfe4a2850a",
    );
});

test("fingerprint treats missing letters as disabled and detects any rule change", () => {
    const sparse = { ...blitzEnglishRules, customBonusAlphabet: { ...blitzEnglishRules.customBonusAlphabet } };
    delete sparse.customBonusAlphabet.x;
    assert.equal(weeklyChallengeRulesFingerprint(sparse), weeklyChallengeRulesFingerprint(blitzEnglishRules));
    for (const change of [
        { minTurnDuration: 3 },
        { startingLives: 3 },
        { maxLives: 4 },
        { customPromptDifficulty: 2 },
        { maxPromptAge: 15 },
        { dictionaryId: "fr" },
        { customBonusAlphabet: { ...blitzEnglishRules.customBonusAlphabet, a: 2 } },
    ]) {
        assert.notEqual(
            weeklyChallengeRulesFingerprint({ ...blitzEnglishRules, ...change }),
            weeklyChallengeRulesFingerprint(blitzEnglishRules),
        );
    }
});

test("rule matching is per language and only against the active period", () => {
    const active = period("p1", 0, 100);
    assert.equal(matchWeeklyChallenge(active, "en", blitzEnglishRules), true);
    assert.equal(matchWeeklyChallenge(active, "fr", { ...blitzEnglishRules, dictionaryId: "fr" }), false);
    assert.equal(matchWeeklyChallenge(active, "en", { ...blitzEnglishRules, maxLives: 4 }), false);
    assert.equal(matchWeeklyChallenge(null, "en", blitzEnglishRules), false);
});

test("the next cached period takes over exactly at the Monday boundary", () => {
    const current = period("current", 0, 1000);
    const next = period("next", 1000, 2000);
    assert.equal(selectActiveWeeklyChallenge(current, next, 999)?.id, "current");
    assert.equal(selectActiveWeeklyChallenge(current, next, 1000)?.id, "next");
    assert.equal(selectActiveWeeklyChallenge(current, next, 2000), null);
    assert.equal(selectActiveWeeklyChallenge(null, null, 0), null);
});

test("instant objectives complete on the right events only", () => {
    assert.equal(isInstantObjectiveReached({ type: "bonus_alphabet", target: null }, { type: "flip" }), true);
    assert.equal(
        isInstantObjectiveReached({ type: "bonus_alphabet", target: null }, { type: "word", promptMemoryChain: 9, alpha: 9 }),
        false,
    );
    assert.equal(
        isInstantObjectiveReached({ type: "prompt_memory", target: 5 }, { type: "word", promptMemoryChain: 4, alpha: 0 }),
        false,
    );
    assert.equal(
        isInstantObjectiveReached({ type: "prompt_memory", target: 5 }, { type: "word", promptMemoryChain: 5, alpha: 0 }),
        true,
    );
    assert.equal(isInstantObjectiveReached({ type: "alpha", target: 5 }, { type: "word", promptMemoryChain: 0, alpha: 5 }), true);
    assert.equal(isInstantObjectiveReached({ type: "alpha", target: 5 }, { type: "flip" }), false);
    assert.equal(isInstantObjectiveReached({ type: "survival", target: null }, { type: "flip" }), false);
});

test("result values follow each challenge's ranking metrics", () => {
    const metrics = { elapsed_ms: 81_234, words: 42, flips: 3 };
    assert.deepEqual(
        weeklyChallengeResultValues({ primary: { metric: "elapsed_ms", order: "asc" }, secondary: null }, metrics),
        { primaryValue: 81_234, secondaryValue: null },
    );
    assert.deepEqual(
        weeklyChallengeResultValues(
            { primary: { metric: "words", order: "asc" }, secondary: { metric: "elapsed_ms", order: "asc" } },
            metrics,
        ),
        { primaryValue: 42, secondaryValue: 81_234 },
    );
    assert.deepEqual(
        weeklyChallengeResultValues({ primary: { metric: "flips", order: "desc" }, secondary: null }, metrics),
        { primaryValue: 3, secondaryValue: null },
    );
});
