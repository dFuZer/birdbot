import assert from "node:assert/strict";
import test from "node:test";
import "../../testEnv";
import type { EventCtx } from "../../lib/types/libEventTypes";
import BirdBotUtils from "./BirdBotUtils.class";
import BirdBotWordSelectionService from "./services/BirdBotWordSelection.service";

test("handleMyTurn submits immediately when it is the bot's turn after reconnect", () => {
    const originalSelect = BirdBotWordSelectionService.select;
    BirdBotWordSelectionService.select = () => "helium";
    const submitted: string[] = [];

    try {
        const ctx = {
            room: {
                roomState: {
                    myPeerId: 5,
                    wordHistory: [],
                    roundStartTimestamp: 1,
                    metadata: {
                        scoresByPeerId: {},
                        nextDelayMs: 0,
                    },
                    gameData: {
                        rules: { maxLives: 3, dictionaryId: "en" },
                        dictionaryManifest: { bonusLetters: "abcdefghijklmnopqrstuvwxyz" },
                        milestone: {
                            name: "round",
                            syllable: "he",
                            currentPlayerPeerId: 5,
                            playerStatesByPeerId: {
                                "5": {
                                    peerId: 5,
                                    lives: 2,
                                    word: "",
                                    rawWord: "",
                                    usedLetters: "",
                                    bonusLetters: "",
                                    startTurn: Date.now(),
                                    startWrite: null,
                                },
                            },
                            startTimestamp: 1,
                        },
                    },
                },
                isHealthy: () => true,
            },
            utils: {
                setWord: (word: string) => submitted.push(word),
            },
        } as unknown as EventCtx;

        BirdBotUtils.handleMyTurn(ctx, {});
        assert.deepEqual(submitted, ["helium"]);
    } finally {
        BirdBotWordSelectionService.select = originalSelect;
    }
});

test("handleMyTurn does not submit when it is another player's turn", () => {
    const originalSelect = BirdBotWordSelectionService.select;
    let selected = 0;
    BirdBotWordSelectionService.select = () => {
        selected += 1;
        return "helium";
    };
    const submitted: string[] = [];

    try {
        const ctx = {
            room: {
                roomState: {
                    myPeerId: 5,
                    wordHistory: [],
                    metadata: { scoresByPeerId: {}, nextDelayMs: 0 },
                    gameData: {
                        rules: { maxLives: 3, dictionaryId: "en" },
                        dictionaryManifest: { bonusLetters: "" },
                        milestone: {
                            name: "round",
                            syllable: "he",
                            currentPlayerPeerId: 9,
                            playerStatesByPeerId: {
                                "9": {
                                    peerId: 9,
                                    lives: 2,
                                    word: "",
                                    rawWord: "",
                                    usedLetters: "",
                                    bonusLetters: "",
                                    startTurn: Date.now(),
                                    startWrite: null,
                                },
                            },
                            startTimestamp: 1,
                        },
                    },
                },
                isHealthy: () => true,
            },
            utils: {
                setWord: (word: string) => submitted.push(word),
            },
        } as unknown as EventCtx;

        BirdBotUtils.handleMyTurn(ctx, {});
        assert.equal(selected, 0);
        assert.deepEqual(submitted, []);
    } finally {
        BirdBotWordSelectionService.select = originalSelect;
    }
});
