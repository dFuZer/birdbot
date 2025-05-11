import i18next from "i18next";
import BirdBot from "./bots/birdbot/BirdBot.class";
import { loadDictionaryResource } from "./bots/birdbot/BirdBotPowerHouse";
import { DictionaryResource } from "./bots/birdbot/BirdBotTypes";
import { birdbotTextResource } from "./bots/birdbot/texts/BirdBotTextUtils";
import Logger from "./lib/class/Logger.class";
import Utilitary from "./lib/class/Utilitary.class";

// @ts-ignore
import WorkingNetworkAdapter from "./lib/class/private/WorkingNetworkAdapter.class";

async function start() {
    const bot = new BirdBot({ networkAdapter: new WorkingNetworkAdapter() });
    const admins = Utilitary.readArrayFromFile("./admins.example.txt");
    Logger.log({
        message: `Starting bot with admins: ${admins.join(", ")}`,
        path: "index.unstable.ts",
    });

    const s1 = performance.now();
    const [
        frenchDictionaryResource,
        englishDictionaryResource,
        spanishDictionaryResource,
        germanDictionaryResource,
        italianDictionaryResource,
        portugueseDictionaryResource,
    ] = await Promise.all([
        loadDictionaryResource("fr", "fr.dictionary.txt"),
        loadDictionaryResource("en", "en.dictionary.txt"),
        loadDictionaryResource("es", "es.dictionary.txt"),
        loadDictionaryResource("de", "de.dictionary.txt"),
        loadDictionaryResource("it", "it.dictionary.txt"),
        loadDictionaryResource("brpt", "brpt.dictionary.txt"),
    ]);
    const s2 = performance.now();
    Logger.log({
        message: `Time taken to load 6 dictionaries in parallel: ${(s2 - s1).toFixed(2)} milliseconds`,
        path: "index.unstable.ts",
    });

    bot.resourceManager.set<DictionaryResource>(`dictionary-fr`, frenchDictionaryResource);
    bot.resourceManager.set<DictionaryResource>(`dictionary-en`, englishDictionaryResource);
    bot.resourceManager.set<DictionaryResource>(`dictionary-es`, spanishDictionaryResource);
    bot.resourceManager.set<DictionaryResource>(`dictionary-de`, germanDictionaryResource);
    bot.resourceManager.set<DictionaryResource>(`dictionary-it`, italianDictionaryResource);
    bot.resourceManager.set<DictionaryResource>(`dictionary-brpt`, portugueseDictionaryResource);

    await i18next.init({
        lng: "en",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
        resources: birdbotTextResource,
    });

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
