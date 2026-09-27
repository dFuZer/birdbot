import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import i18next from "i18next";
import "../../../testEnv";
import type { Chatter } from "../../../lib/types/gameTypes";
import type { EventCtx } from "../../../lib/types/libEventTypes";
import type { BirdBotRoomMetadata, PlayerGameScores } from "../BirdBotTypes";
import { weeklyChallengeRulesFingerprint, type WeeklyChallengePeriod } from "../BirdBotWeeklyChallengeRules";
import { birdbotTextResource } from "../texts/BirdBotTextUtils";
import BirdBotApiWriteQueue from "./BirdBotApiWriteQueue.service";
import BirdBotModerationService from "./BirdBotModeration.service";
import BirdBotWeeklyChallengeService from "./BirdBotWeeklyChallenge.service";

const alphaRules = {
    dictionaryId: "en",
    minTurnDuration: 5,
    promptDifficulty: "custom" as const,
    customPromptDifficulty: 1,
    maxPromptAge: 16,
    startingLives: 2,
    maxLives: 3,
    customBonusAlphabet: Object.fromEntries([..."abcdefghijklmnopqrstuvwxyz"].map((letter) => [letter, 2])),
};

function alphaPeriod(): WeeklyChallengePeriod {
    const now = Date.now();
    return {
        id: "7d3a4e0c-8b1f-4f7a-9d2e-5c6b7a8f9e01",
        sequence: 2,
        kind: "ALPHA_SPRINT",
        startsAt: now - 60_000,
        endsAt: now + 60_000,
        configVersion: 1,
        config: {
            version: 1,
            kind: "ALPHA_SPRINT",
            baseMode: "custom",
            objective: { type: "alpha", target: 5 },
            ranking: { primary: { metric: "elapsed_ms", order: "asc" }, secondary: null },
            languages: {
                en: { rules: alphaRules, fingerprint: weeklyChallengeRulesFingerprint(alphaRules), targetLetter: null },
            },
        },
    };
}

function scores(overrides: Partial<PlayerGameScores>): PlayerGameScores {
    return { words: 0, flips: 0, alpha: 0, ...overrides } as PlayerGameScores;
}

function chatter(peerId: number, authId: string | null, nickname = `P${peerId}`): Chatter {
    return { peerId, authId, nickname } as Chatter;
}

function makeCtx(rules = alphaRules) {
    const messages: string[] = [];
    const previews: string[] = [];
    const ctx = {
        room: {
            roomState: {
                myPeerId: 1,
                roundStartTimestamp: Date.now() - 12_345,
                gameData: { rules: { ...rules }, milestone: { name: "round" } },
                metadata: { training: null } as unknown as BirdBotRoomMetadata,
            },
            constantRoomData: { roomCreatorAuthId: "creator" },
            isHealthy: () => true,
        },
        utils: {
            sendChatMessage: (message: string) => messages.push(message),
            previewWord: (text: string) => previews.push(text),
            userIsAdmin: () => false,
        },
    } as unknown as EventCtx;
    return { ctx, messages, previews };
}

const originalEnqueue = BirdBotApiWriteQueue.enqueueWeeklyChallengeResult;
const originalIsBlacklisted = BirdBotModerationService.isBlacklisted;
let submitted: Record<string, unknown>[] = [];

before(async () => {
    await i18next.init({ lng: "en", fallbackLng: "en", interpolation: { escapeValue: false }, resources: birdbotTextResource });
});

beforeEach(() => {
    submitted = [];
    BirdBotWeeklyChallengeService.setPeriodsForTests(alphaPeriod());
    BirdBotModerationService.isBlacklisted = async () => false;
    BirdBotApiWriteQueue.enqueueWeeklyChallengeResult = async (body) => {
        submitted.push(body);
        return {
            improved: true,
            rank: 1,
            totalPlayers: 1,
            best: { primaryValue: 12_345, secondaryValue: null, elapsedMs: 12_345, wordsCount: 6, achievedAt: Date.now() },
        };
    };
});

after(() => {
    BirdBotApiWriteQueue.enqueueWeeklyChallengeResult = originalEnqueue;
    BirdBotModerationService.isBlacklisted = originalIsBlacklisted;
    BirdBotWeeklyChallengeService.setPeriodsForTests(null);
});

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("guests are celebrated with an authentication reminder but never submitted", () => {
    const { ctx, messages } = makeCtx();
    BirdBotWeeklyChallengeService.handleWord(ctx, chatter(2, null, "Guest"), scores({ alpha: 5, words: 6 }), 0);
    assert.equal(submitted.length, 0);
    assert.match(messages[0]!, /Guest completed the weekly challenge/);
    assert.match(messages[0]!, /Log in/);
    assert.equal(BirdBotWeeklyChallengeService.state(ctx.room).pendingCelebration, true);
});

test("authenticated completions are announced with rank only after the API confirms", async () => {
    const { ctx, messages } = makeCtx();
    BirdBotWeeklyChallengeService.handleWord(ctx, chatter(2, "auth-2", "Alice"), scores({ alpha: 5, words: 6 }), 0);
    assert.equal(messages.length, 0);
    assert.equal(BirdBotWeeklyChallengeService.state(ctx.room).pendingCelebration, false);
    await flush();
    assert.equal(submitted.length, 1);
    assert.equal(submitted[0]!.language, "en");
    assert.equal(submitted[0]!.rulesFingerprint, alphaPeriod().config.languages.en!.fingerprint);
    assert.equal(submitted[0]!.secondaryValue, null);
    assert.match(messages[0]!, /Alice completed the weekly challenge: .* new personal best! — Rank #1 of 1/);
    assert.equal(BirdBotWeeklyChallengeService.state(ctx.room).pendingCelebration, true);
});

test("sprint results freeze on first completion and simultaneous completions share one celebration", async () => {
    const { ctx, previews } = makeCtx();
    BirdBotWeeklyChallengeService.handleWord(ctx, chatter(2, "auth-2"), scores({ alpha: 5 }), 0);
    BirdBotWeeklyChallengeService.handleWord(ctx, chatter(2, "auth-2"), scores({ alpha: 6 }), 0);
    BirdBotWeeklyChallengeService.handleWord(ctx, chatter(3, "auth-3"), scores({ alpha: 5 }), 0);
    await flush();
    assert.equal(submitted.length, 2);

    assert.equal(BirdBotWeeklyChallengeService.consumeCelebration(ctx), 4000);
    assert.deepEqual(previews, ["Challenge complete!"]);
    assert.equal(BirdBotWeeklyChallengeService.consumeCelebration(ctx), 0);
});

test("objectives do not count below target, for BirdBot itself, or when rules do not match", async () => {
    const below = makeCtx();
    BirdBotWeeklyChallengeService.handleWord(below.ctx, chatter(2, "auth-2"), scores({ alpha: 4 }), 0);
    const self = makeCtx();
    BirdBotWeeklyChallengeService.handleWord(self.ctx, chatter(1, "bot"), scores({ alpha: 5 }), 0);
    const tampered = makeCtx({ ...alphaRules, maxLives: 4 });
    BirdBotWeeklyChallengeService.handleWord(tampered.ctx, chatter(2, "auth-2"), scores({ alpha: 5 }), 0);
    await flush();
    assert.equal(submitted.length, 0);
    assert.equal(below.messages.length + self.messages.length + tampered.messages.length, 0);
});

test("a celebration confirmed after the round ended is dropped", async () => {
    const { ctx } = makeCtx();
    BirdBotWeeklyChallengeService.handleWord(ctx, chatter(2, "auth-2"), scores({ alpha: 5 }), 0);
    ctx.room.roomState.roundStartTimestamp = Date.now();
    await flush();
    assert.equal(BirdBotWeeklyChallengeService.state(ctx.room).pendingCelebration, false);
});

test("confirmed rule matching reports changes so announcements happen once", () => {
    const { ctx } = makeCtx();
    assert.deepEqual(BirdBotWeeklyChallengeService.syncRoomMatch(ctx.room), { matched: true, changed: true });
    assert.deepEqual(BirdBotWeeklyChallengeService.syncRoomMatch(ctx.room), { matched: true, changed: false });
    ctx.room.roomState.gameData!.rules.maxLives = 4;
    assert.deepEqual(BirdBotWeeklyChallengeService.syncRoomMatch(ctx.room), { matched: false, changed: true });
});
