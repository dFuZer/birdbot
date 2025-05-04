import BirdBot from "./bots/birdbot/BirdBot.class";
import { BirdBotLanguage, BirdBotSupportedDictionaryId } from "./bots/birdbot/BirdBotTypes";
import Logger from "./lib/class/Logger.class";
import WorkingNetworkAdapter from "./lib/class/private/WorkingNetworkAdapter.class";
import Utilitary from "./lib/class/Utilitary.class";

async function start() {
    const bot = new BirdBot({ networkAdapter: new WorkingNetworkAdapter() });
    const admins = Utilitary.readArrayFromFile("./admins.txt");
    Logger.log({
        message: `Starting bot with admins: ${admins.join(", ")}`,
        path: "index.unstable.ts",
    });
    await bot.init({ adminAccountUsernames: admins });

    const loadDictionaryShortcut = (
        dictionaryId: BirdBotSupportedDictionaryId,
        language: BirdBotLanguage,
        lightMode: boolean
    ) => {
        bot.loadDictionaryResourceFromFile({
            key: `dictionary-${language}`,
            path: `./resources/${language}.dictionary.txt`,
            dictionaryId,
            lightMode,
        });
    };

    loadDictionaryShortcut("fr", "fr", false);
    loadDictionaryShortcut("en", "en", false);
    loadDictionaryShortcut("es", "es", false);
    loadDictionaryShortcut("de", "de", true);
    loadDictionaryShortcut("it", "it", true);
    loadDictionaryShortcut("pt-BR", "brpt", true);

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
