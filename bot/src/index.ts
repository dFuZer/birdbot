import i18next from "i18next";
import path from "path";
import BirdBot from "./bots/birdbot/BirdBot.class";
import { listedRecordsPerLanguage } from "./bots/birdbot/BirdBotConstants";
import { birdbotPeriodicTasks } from "./bots/birdbot/BirdbotPeriodicTasks";
import { loadDictionaryResource } from "./bots/birdbot/BirdBotPowerHouse";
import getBirdBotHttpServer from "./bots/birdbot/BirdBotServer";
import { BirdBotLanguage, DictionaryResource, ListedRecordListResource } from "./bots/birdbot/BirdBotTypes";
import { birdbotTextResource } from "./bots/birdbot/texts/BirdBotTextUtils";
import AbstractNetworkAdapter from "./lib/abstract/AbstractNetworkAdapter.class";
import Logger from "./lib/class/Logger.class";
import Utilitary from "./lib/class/Utilitary.class";
import { resourcesPath } from "./lib/paths";

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
                    "Are you sure you implemented all the class methods correctly ?",
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

    // Initialize bot
    const permanentRoomLanguages: BirdBotLanguage[] = ["fr", "en", "es", "brpt"];
    const allowedLanguages: BirdBotLanguage[] = ["fr", "en", "es", "brpt", "de", "it"];
    const bot = new BirdBot({
        networkAdapter: new NetworkAdapterClass(),
        periodicTasks: birdbotPeriodicTasks,
        mainRoomLanguages: permanentRoomLanguages,
    });

    // Initialize bot HTTP server for communication with the API
    bot.initServer({
        app: getBirdBotHttpServer(bot),
        port: 3001,
    });

    // Initialize bot admins
    let admins: string[];
    try {
        admins = Utilitary.readArrayFromFile("./admins.txt");
        Logger.log({
            message: `Starting bot with admins: ${admins.join(", ")}`,
            path: "index.unstable.ts",
        });
    } catch (e) {
        admins = [];
        Logger.error({
            message: `No admins.txt file found. Running the bot with no admins.`,
            path: "index.unstable.ts",
        });
    }

    // Load dictionaries
    {
        const s1 = performance.now();
        const loadedResources = await Promise.all(
            allowedLanguages.map((lang) => loadDictionaryResource(lang, `${lang}.dictionary.txt`))
        );
        const s2 = performance.now();
        Logger.log({
            message: `Time taken to load 6 dictionaries in parallel: ${(s2 - s1).toFixed(2)} milliseconds`,
            path: "index.unstable.ts",
        });

        loadedResources.forEach((resource) => {
            bot.resourceManager.set<DictionaryResource>(`dictionary-${resource.metadata.language}`, resource);
        });
    }

    // Load lists for listed records
    {
        const s1 = performance.now();
        const records = Object.entries(listedRecordsPerLanguage)
            .map(([language, recordList]) => {
                return {
                    language,
                    recordList,
                };
            })
            .filter((object) => allowedLanguages.includes(object.language as BirdBotLanguage));

        for (const { language, recordList } of records) {
            for (const record of recordList) {
                const fileName = `${record}-${language}.list.txt`;
                const filePath = path.join(resourcesPath, "lists", fileName);
                const resource = await Utilitary.readArrayFromFileAsync(filePath);
                bot.resourceManager.set<ListedRecordListResource>(`list-${record}-${language}`, {
                    resource,
                    metadata: {
                        language: language as BirdBotLanguage,
                        resourceFilePath: filePath,
                    },
                });
            }
        }
        const s2 = performance.now();
        Logger.log({
            message: `Time taken to load 6 dictionaries in parallel: ${(s2 - s1).toFixed(2)} milliseconds`,
            path: "index.unstable.ts",
        });
    }

    // Load i18n text resources
    {
        await i18next.init({
            lng: "en",
            fallbackLng: "en",
            interpolation: {
                escapeValue: false,
            },
            resources: birdbotTextResource,
        });
    }

    // Initialize bot session
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

    // Create test room
    await bot.createRoom({
        roomCreatorUsername: null,
        targetConfig: {
            dictionaryId: "fr",
            gameMode: "survival",
            birdbotGameMode: "regular",
            isPublic: false,
            roomName: "BirdBot test room",
        },
    });

    // Start periodic tasks
    await bot.startPeriodicTasks();

    // Start server
    bot.startServer();
}

start();
