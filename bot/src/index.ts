import BirdBot from "./bots/birdbot/BirdBot.class";
import Logger from "./lib/class/Logger.class";
import WorkingNetworkAdapter from "./lib/class/private/WorkingNetworkAdapter.class";

async function start() {
    Logger.log({
        message: "Starting bot",
        path: "index.ts",
    });
    const bot = new BirdBot({ networkAdapter: new WorkingNetworkAdapter() });
    await bot.init();
    await bot.loadDictionaryResourceFromFile({
        key: "dictionary-en",
        path: "./resources/en.dictionary.txt",
        dictionaryId: "en",
    });
    await bot.createRoom({ dictionaryId: "en", gameMode: "survival" });
}

start();
