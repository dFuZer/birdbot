import BirdBot from "./bots/birdbot/BirdBot.class";
import WorkingNetworkAdapter from "./lib/class/private/WorkingNetworkAdapter.class";

async function start() {
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
