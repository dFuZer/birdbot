import assert from "node:assert/strict";
import test from "node:test";
import "../../../testEnv";
import type { BirdBotRoomMetadata } from "../BirdBotTypes";
import {
    decideRecoverySetup,
    mapWithConcurrency,
    remapPeerKeyedState,
    resolveRoundStartTimestamp,
    retryWithBackoff,
    shouldResetRoundState,
} from "./BirdBotRecovery.service";

test("decideRecoverySetup plays immediately on a recovered own turn", () => {
    const decision = decideRecoverySetup({
        isFirstSetup: true,
        isRecoveryJoin: true,
        wasInitialized: true,
        isLeader: true,
        milestoneName: "round",
        isSeated: true,
        isOwnTurn: true,
    });
    assert.equal(decision.destroy, false);
    if (decision.destroy) return;
    assert.equal(decision.applyTargetRules, false);
    assert.equal(decision.joinRound, false);
    assert.equal(decision.backfillCurrentWords, true);
    assert.equal(decision.playTurn, true);
    assert.equal(decision.clearNextDelayMs, true);
});

test("decideRecoverySetup waits for nextTurn when recovered but it is someone else's turn", () => {
    const decision = decideRecoverySetup({
        isFirstSetup: true,
        isRecoveryJoin: true,
        wasInitialized: true,
        isLeader: true,
        milestoneName: "round",
        isSeated: true,
        isOwnTurn: false,
    });
    assert.equal(decision.destroy, false);
    if (decision.destroy) return;
    assert.equal(decision.playTurn, false);
    assert.equal(decision.joinRound, false);
    assert.equal(decision.backfillCurrentWords, true);
});

test("decideRecoverySetup still applies rules on a genuine first join", () => {
    const decision = decideRecoverySetup({
        isFirstSetup: true,
        isRecoveryJoin: false,
        wasInitialized: false,
        isLeader: true,
        milestoneName: "seating",
        isSeated: false,
        isOwnTurn: false,
    });
    assert.equal(decision.destroy, false);
    if (decision.destroy) return;
    assert.equal(decision.applyTargetRules, true);
    assert.equal(decision.joinRound, true);
    assert.equal(decision.playTurn, false);
});

test("decideRecoverySetup destroys when the bot is not leader", () => {
    assert.deepEqual(
        decideRecoverySetup({
            isFirstSetup: true,
            isRecoveryJoin: true,
            wasInitialized: true,
            isLeader: false,
            milestoneName: "round",
            isSeated: true,
            isOwnTurn: true,
        }),
        { destroy: true },
    );
});

test("shouldResetRoundState only when the milestone changed across the restart", () => {
    assert.equal(shouldResetRoundState("round", "seating"), true);
    assert.equal(shouldResetRoundState("seating", "round"), true);
    assert.equal(shouldResetRoundState("round", "round"), false);
    assert.equal(shouldResetRoundState(null, "round"), false);
});

test("resolveRoundStartTimestamp prefers JKLM then the checkpoint", () => {
    assert.equal(resolveRoundStartTimestamp(111, 222, 333), 111);
    assert.equal(resolveRoundStartTimestamp(undefined, 222, 333), 222);
    assert.equal(resolveRoundStartTimestamp(undefined, 0, 333), 333);
});

test("remapPeerKeyedState moves the bot's scores and turn keys", () => {
    const metadata = {
        scoresByPeerId: {
            "7": {
                words: 4,
                flips: 0,
                depletedSyllables: 0,
                alpha: 1,
                currentWordsWithoutDeath: 4,
                maxWordsWithoutDeath: 4,
                previousSyllableScore: 0,
                previousSyllable: null,
                multiSyllables: 0,
                hyphenWords: 0,
                moreThan20LettersWords: 0,
                slurs: 0,
                creatures: 0,
                ethnonyms: 0,
                chemicals: 0,
                plants: 0,
                foods: 0,
                adverbs: 0,
            },
            "3": {
                words: 1,
                flips: 0,
                depletedSyllables: 0,
                alpha: 0,
                currentWordsWithoutDeath: 1,
                maxWordsWithoutDeath: 1,
                previousSyllableScore: 0,
                previousSyllable: null,
                multiSyllables: 0,
                hyphenWords: 0,
                moreThan20LettersWords: 0,
                slurs: 0,
                creatures: 0,
                ethnonyms: 0,
                chemicals: 0,
                plants: 0,
                foods: 0,
                adverbs: 0,
            },
        },
        greetedPeerIds: new Set(["7", "3"]),
        flipTurnKeys: new Set(["7:10"]),
        scoredWordTurnKeys: new Set(["7:10", "3:11"]),
        pendingWordRegistrations: new Map([
            [
                "7:10",
                {
                    turnKey: "7:10",
                    data: {
                        word: "hat",
                        submitResult: "success" as const,
                        prompt: "ha",
                        game: { id: "g", lang: "en" as const, mode: "regular" as const },
                        player: { authId: "bot", nickname: "BirdBot" },
                    },
                },
            ],
        ]),
    } as Pick<
        BirdBotRoomMetadata,
        "scoresByPeerId" | "greetedPeerIds" | "flipTurnKeys" | "scoredWordTurnKeys" | "pendingWordRegistrations"
    >;

    remapPeerKeyedState(metadata as BirdBotRoomMetadata, 7, 21);
    assert.equal(metadata.scoresByPeerId["21"]?.words, 4);
    assert.equal(metadata.scoresByPeerId["7"], undefined);
    assert.equal(metadata.scoresByPeerId["3"]?.words, 1);
    assert.ok(metadata.greetedPeerIds.has("21"));
    assert.ok(!metadata.greetedPeerIds.has("7"));
    assert.ok(metadata.scoredWordTurnKeys.has("21:10"));
    assert.ok(metadata.scoredWordTurnKeys.has("3:11"));
    assert.ok(metadata.pendingWordRegistrations.has("21:10"));
});

test("retryWithBackoff keeps going until success and mapWithConcurrency bounds work", async () => {
    let attempts = 0;
    const value = await retryWithBackoff(async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("transient");
        return "ok";
    }, [1, 1]);
    assert.equal(value, "ok");
    assert.equal(attempts, 3);

    await assert.rejects(
        () =>
            retryWithBackoff(async () => {
                throw new Error("still failing");
            }, [1]),
        /still failing/,
    );

    const seen: number[] = [];
    const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (item) => {
        seen.push(item);
        return item * 2;
    });
    assert.deepEqual(results, [2, 4, 6, 8]);
    assert.equal(seen.length, 4);
});
