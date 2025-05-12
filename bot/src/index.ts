import i18next from "i18next";
import BirdBot from "./bots/birdbot/BirdBot.class";
import { birdbotPeriodicTasks } from "./bots/birdbot/BirdbotPeriodicTasks";
import { loadDictionaryResource } from "./bots/birdbot/BirdBotPowerHouse";
import { DictionaryResource } from "./bots/birdbot/BirdBotTypes";
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
    console.log(e);
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
  const AdapterClass = await tryGetNetworkAdapter();
  const bot = new BirdBot({
    networkAdapter: new AdapterClass(),
    periodicTasks: birdbotPeriodicTasks,
  });
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
    message: `Time taken to load 6 dictionaries in parallel: ${(
      s2 - s1
    ).toFixed(2)} milliseconds`,
    path: "index.unstable.ts",
  });

  bot.resourceManager.set<DictionaryResource>(
    `dictionary-fr`,
    frenchDictionaryResource
  );
  bot.resourceManager.set<DictionaryResource>(
    `dictionary-en`,
    englishDictionaryResource
  );
  bot.resourceManager.set<DictionaryResource>(
    `dictionary-es`,
    spanishDictionaryResource
  );
  bot.resourceManager.set<DictionaryResource>(
    `dictionary-de`,
    germanDictionaryResource
  );
  bot.resourceManager.set<DictionaryResource>(
    `dictionary-it`,
    italianDictionaryResource
  );
  bot.resourceManager.set<DictionaryResource>(
    `dictionary-brpt`,
    portugueseDictionaryResource
  );

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

  await bot.startPeriodicTasks();
}

start();
