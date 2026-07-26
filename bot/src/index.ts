import i18next from "i18next";
import path from "path";
import BirdBot from "./bots/birdbot/BirdBot.class";
import { listedRecordsPerLanguage } from "./bots/birdbot/BirdBotConstants";
import BirdBotDefinitions from "./bots/birdbot/BirdBotDefinitions.class";
import { birdbotPeriodicTasks } from "./bots/birdbot/BirdbotPeriodicTasks";
import { loadDictionaryResource } from "./bots/birdbot/BirdBotPowerHouse";
import getBirdBotHttpServer from "./bots/birdbot/BirdBotServer";
import { BirdBotLanguage, DictionaryResource, ListedRecordListResource } from "./bots/birdbot/BirdBotTypes";
import { birdbotTextResource } from "./bots/birdbot/texts/BirdBotTextUtils";
import Logger from "./lib/class/Logger.class";
import Utilitary from "./lib/class/Utilitary.class";
import { resourcesPath } from "./lib/paths";

async function start() {
    const permanentRoomLanguages: BirdBotLanguage[] = ["fr"];
    const allowedLanguages: BirdBotLanguage[] = ["fr", "en", "es", "brpt", "de", "it"];
    const bot = new BirdBot({
        periodicTasks: birdbotPeriodicTasks,
        mainRoomLanguages: permanentRoomLanguages,
    });

    BirdBotDefinitions.connect();

    bot.initServer({
        app: getBirdBotHttpServer(bot),
        port: 3001,
    });

    let admins: string[];
    try {
        admins = Utilitary.readArrayFromFile("./admins.txt");
        Logger.log({
            message: `Starting bot with admins: ${admins.join(", ")}`,
            path: "index.ts",
        });
    } catch (e) {
        admins = [];
        Logger.error({
            message: `No admins.txt file found. Running the bot with no admins.`,
            path: "index.ts",
        });
    }

    {
        const s1 = performance.now();
        const loadedResources = await Promise.all(
            allowedLanguages.map((lang) => loadDictionaryResource(lang, `${lang}.dictionary.txt`)),
        );
        const s2 = performance.now();
        Logger.log({
            message: `Time taken to load dictionaries in parallel: ${(s2 - s1).toFixed(2)} milliseconds`,
            path: "index.ts",
        });

        loadedResources.forEach((resource) => {
            bot.resourceManager.set<DictionaryResource>(`dictionary-${resource.metadata.language}`, resource);
        });
    }

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
            message: `Time taken to load listed records: ${(s2 - s1).toFixed(2)} milliseconds`,
            path: "index.ts",
        });
    }

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

    while (true) {
        try {
            await bot.init({ adminAuthIds: admins });
            break;
        } catch (e) {
            Logger.error({
                message: `Error while initializing bot. Retrying in 1 second...`,
                path: "index.ts",
                error: e,
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    await bot.startPeriodicTasks();
    bot.startServer();
}

start();
