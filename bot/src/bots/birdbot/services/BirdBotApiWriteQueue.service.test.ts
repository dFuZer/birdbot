import assert from "node:assert/strict";
import test from "node:test";
import "../../../testEnv";
import BirdBotApiWriteQueue from "./BirdBotApiWriteQueue.service";

test("BirdBotApiWriteQueue.drain sends pending items and times out leftover work", async () => {
    BirdBotApiWriteQueue.resetForTests();
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
        calls += 1;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    try {
        BirdBotApiWriteQueue.enqueueWord({
            word: "one",
            idempotencyKey: "word-1",
        });
        BirdBotApiWriteQueue.enqueueWord({
            word: "two",
            idempotencyKey: "word-2",
        });
        assert.equal(BirdBotApiWriteQueue.pendingCount(), 2);
        const remaining = await BirdBotApiWriteQueue.drain(1000);
        assert.equal(remaining, 0);
        assert.equal(calls, 2);
    } finally {
        globalThis.fetch = originalFetch;
        BirdBotApiWriteQueue.resetForTests();
    }
});

test("BirdBotApiWriteQueue.drain returns leftover items after timeout", async () => {
    BirdBotApiWriteQueue.resetForTests();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        throw new Error("api down");
    }) as typeof fetch;

    try {
        BirdBotApiWriteQueue.enqueueWord({
            word: "stuck",
            idempotencyKey: "word-timeout",
        });
        const remaining = await BirdBotApiWriteQueue.drain(30);
        assert.equal(remaining, 1);
    } finally {
        globalThis.fetch = originalFetch;
        BirdBotApiWriteQueue.resetForTests();
    }
});
