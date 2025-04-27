import BirdBot from "./bots/birdbot/BirdBot.class";
import BogusNetworkAdapter from "./lib/class/BogusNetworkAdapter.class";
import Utilitary from "./lib/class/Utilitary.class";

async function start() {
    const bot = new BirdBot({ networkAdapter: new BogusNetworkAdapter() });
    await bot.init({ adminAccountUsernames: Utilitary.readArrayFromFile("./admins.example.txt") });
    await bot.loadDictionaryResourceFromFile({
        key: "dictionary-en",
        path: "./resources/en.dictionary.example.txt",
        dictionaryId: "en",
    });
    await bot.createRoom({ dictionaryId: "en", gameMode: "survival", roomCreatorUsername: null });
}

start();
