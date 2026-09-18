import assert from "node:assert/strict";
import test from "node:test";
import "../../../testEnv";
import type Bot from "../../../lib/class/Bot.class";
import BirdBotParityApiService from "./BirdBotParityApi.service";
import BirdBotStaffSync from "./BirdBotStaffSync.service";

test("staff refresh failures do not crash startup", async () => {
    const originalGetStaff = BirdBotParityApiService.getStaff;
    BirdBotParityApiService.getStaff = async () => {
        throw new Error("BirdBot API returned HTTP 404");
    };
    const bot = {
        botData: {
            staff: BirdBotStaffSync.empty(),
        },
    } as unknown as Bot;

    try {
        await BirdBotStaffSync.refresh(bot);
        assert.equal(bot.botData?.staff.admins.size, 0);
        assert.equal(bot.botData?.staff.fingerprint, "a:|m:");
    } finally {
        BirdBotParityApiService.getStaff = originalGetStaff;
    }
});
