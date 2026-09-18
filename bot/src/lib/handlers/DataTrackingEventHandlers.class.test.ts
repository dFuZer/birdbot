import assert from "node:assert/strict";
import test from "node:test";
import "../../testEnv";
import { resolveRoundStartTimestamp } from "./DataTrackingEventHandlers.class";

test("DataTracking resolveRoundStartTimestamp keeps a checkpointed round id when JKLM omits it", () => {
    assert.equal(resolveRoundStartTimestamp(undefined, 42, 99), 42);
    assert.equal(resolveRoundStartTimestamp(7, 42, 99), 7);
    assert.equal(resolveRoundStartTimestamp("nope", 0, 99), 99);
});
