import BirdBot from "./bots/birdbot/BirdBot.class";
import BogusNetworkAdapter from "./lib/class/BogusNetworkAdapter.class";

async function start() {
    const bot = new BirdBot({ networkAdapter: new BogusNetworkAdapter() });
    await bot.init();
    await bot.loadDictionaryResourceFromFile({
        key: "dictionary-en",
        path: "./resources/en.dictionary.example.txt",
        dictionaryId: "en",
    });
    await bot.createRoom({ dictionaryId: "en", gameMode: "survival" });
}

start();
