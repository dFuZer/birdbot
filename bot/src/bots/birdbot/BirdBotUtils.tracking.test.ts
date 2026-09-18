import assert from "node:assert/strict";
import test from "node:test";
import "../../testEnv";
import type { Chatter } from "../../lib/types/gameTypes";
import type { EventCtx } from "../../lib/types/libEventTypes";
import BirdBotUtils from "./BirdBotUtils.class";

function chatter(overrides: Partial<Chatter> = {}): Chatter {
    return {
        peerId: 2,
        nickname: "Player",
        authId: "player",
        isOnline: true,
        isModerator: false,
        ...overrides,
    };
}

function ctx(myPeerId = 1): EventCtx {
    return { room: { roomState: { myPeerId } } } as unknown as EventCtx;
}

test("shouldPersistPlayerStats only keeps players with an auth id", () => {
    assert.equal(BirdBotUtils.shouldPersistPlayerStats(ctx(), undefined), false);
    assert.equal(BirdBotUtils.shouldPersistPlayerStats(ctx(), chatter({ authId: null })), false);
    assert.equal(BirdBotUtils.shouldPersistPlayerStats(ctx(), chatter({ authId: "" })), false);
    assert.equal(BirdBotUtils.shouldPersistPlayerStats(ctx(), chatter({ peerId: 1, authId: "BirdBot" })), false);
    assert.equal(BirdBotUtils.shouldPersistPlayerStats(ctx(), chatter({ peerId: 2, authId: "dfuzer" })), true);
});

test("registerWord ignores submissions without an auth id", async () => {
    const result = await BirdBotUtils.registerWord({
        game: { id: "00000000-0000-0000-0000-000000000000", lang: "en", mode: "regular" },
        player: { authId: "  ", nickname: "BirdBot" },
        word: "hello",
        submitResult: "success",
        prompt: "he",
        flip: false,
    });
    assert.equal(result, null);
});
