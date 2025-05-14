import i18next from "i18next";
import BirdBot from "./bots/birdbot/BirdBot.class";
import { birdbotPeriodicTasks } from "./bots/birdbot/BirdbotPeriodicTasks";
import { loadDictionaryResource } from "./bots/birdbot/BirdBotPowerHouse";
import getBirdBotHttpServer from "./bots/birdbot/BirdBotServer";
import {
    BirdBotLanguage,
    DictionaryResource,
} from "./bots/birdbot/BirdBotTypes";
import { birdbotTextResource } from "./bots/birdbot/texts/BirdBotTextUtils";
import AbstractNetworkAdapter from "./lib/abstract/AbstractNetworkAdapter.class";
import Logger from "./lib/class/Logger.class";
import Utilitary from "./lib/class/Utilitary.class";

async function tryGetNetworkAdapter() {
    try {
        const module = (await import(
            // @ts-ignore
            "./lib/class/private/NetworkAdapter.class"
        )) as any;
        try {
            const instance = new module.default();
            instance.getJoinMessage();
            return module.default as new () => AbstractNetworkAdapter;
        } catch (e) {
            Logger.error({
                path: "index.ts",
                message:
                    "Found an implementation of the NetworkAdapter class, but it is not working properly.\n" +
                    "Are you sure you implemented all the class methods correctly?.",
            });
            console.error(e);
            process.exit(1);
        }
    } catch (e) {
        Logger.error({
            path: "index.ts",
            message:
                "To run the bot, you must create a working implementation of the NetworkAdapter class\n" +
                "in the lib/class/private/NetworkAdapter.class.ts file.\n" +
                "See the README.md of the github repository for more information.\n" +
                "Link of the repository: https://github.com/dFuZer/birdbot",
        });
        process.exit(1);
    }
}

async function start() {
    const NetworkAdapterClass = await tryGetNetworkAdapter();
    const launchLanguages = [
        "fr",
        "en",
        "es",
        "brpt",
    ] satisfies BirdBotLanguage[];
    const bot = new BirdBot({
        networkAdapter: new NetworkAdapterClass(),
        periodicTasks: birdbotPeriodicTasks,
        mainRoomLanguages: launchLanguages,
    });
    bot.initServer({
        app: getBirdBotHttpServer(bot),
        port: 3001,
    });
    let admins: string[];
    try {
        admins = Utilitary.readArrayFromFile("./admins.txt");
    } catch (e) {
        admins = [];
        Logger.error({
            message: `No admins.txt file found. Running the bot with no admins.`,
            path: "index.unstable.ts",
        });
    }
    Logger.log({
        message: `Starting bot with admins: ${admins.join(", ")}`,
        path: "index.unstable.ts",
    });

    const s1 = performance.now();
    const loadedResources = await Promise.all(
        launchLanguages.map((lang) =>
            loadDictionaryResource(lang, `${lang}.dictionary.txt`)
        )
    );
    const s2 = performance.now();
    Logger.log({
        message: `Time taken to load 6 dictionaries in parallel: ${(
            s2 - s1
        ).toFixed(2)} milliseconds`,
        path: "index.unstable.ts",
    });

    loadedResources.forEach((resource) => {
        bot.resourceManager.set<DictionaryResource>(
            `dictionary-${resource.metadata.language}`,
            resource
        );
    });

    await i18next.init({
        lng: "en",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
        resources: birdbotTextResource,
    });

    while (true) {
        try {
            await bot.init({ adminAccountUsernames: admins });
            break;
        } catch (e) {
            Logger.error({
                message: `Error while initializing bot. Retrying in 1 second...`,
                path: "index.unstable.ts",
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    await bot.createRoom({
        roomCreatorUsername: null,
        targetConfig: {
            dictionaryId: "fr",
            gameMode: "survival",
            birdbotGameMode: "regular",
        },
    });

    await bot.startPeriodicTasks();

    bot.startServer();
}

start();
