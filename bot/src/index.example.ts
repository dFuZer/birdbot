import BirdBot from "./bots/birdbot/BirdBot.class";
import { loadDictionaryResource } from "./bots/birdbot/BirdBotPowerHouse";
import { DictionaryResource } from "./bots/birdbot/BirdBotTypes";
import BogusNetworkAdapter from "./lib/class/BogusNetworkAdapter.class";
import Logger from "./lib/class/Logger.class";
import Utilitary from "./lib/class/Utilitary.class";

async function start() {
    const bot = new BirdBot({ networkAdapter: new BogusNetworkAdapter() });
    const admins = Utilitary.readArrayFromFile("./admins.example.txt");
    Logger.log({
        message: `Starting bot with admins: ${admins.join(", ")}`,
        path: "index.unstable.ts",
    });

    const englishDictionaryResource = await loadDictionaryResource("en", "en.dictionary.txt");
    bot.resourceManager.set<DictionaryResource>(`dictionary-en`, englishDictionaryResource);

    await bot.init({ adminAccountUsernames: admins });

    await bot.createRoom({
        roomCreatorUsername: null,
        targetConfig: {
            dictionaryId: "fr",
            gameMode: "survival",
            birdbotGameMode: "regular",
        },
    });
}

start();
