import { writeFile } from "fs/promises";
import { type PeriodicTask } from "../../lib/class/Bot.class";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import BirdBot from "./BirdBot.class";
import { birdbotLanguageToDictionaryId, dictionaryIdToBirdbotLanguage, languageEnumSchema } from "./BirdBotConstants";
import {
    BirdBotLanguage,
    BirdBotRoomMetadata,
    BirdBotSupportedDictionaryId,
    CacheableDictionaryMetadata,
    DictionaryResource,
} from "./BirdBotTypes";
import BirdBotUtils from "./BirdBotUtils.class";
import { t } from "./texts/BirdBotTextUtils";

export const birdbotPeriodicTasks: PeriodicTask[] = [
    {
        intervalInMs: 10000,
        setIntervalTimeout: undefined,
        setTimeoutTimeout: undefined,
        fn: (ctx) => {
            const { bot } = ctx;
            for (const roomId in bot.rooms) {
                const room = bot.rooms[roomId];
                const hostAuthId = room.constantRoomData.roomCreatorAuthId;
                const roomMetadata = room.roomState.metadata as BirdBotRoomMetadata;
                const chatters = room.roomState.roomData?.chatters;

                if (!room.isConnected()) continue;
                if (roomMetadata.hostLeftIteration === undefined) continue;
                if (chatters === undefined) continue;
                if (hostAuthId === null) continue;

                const host = chatters.find((c) => c.authId === hostAuthId);
                const inRound = room.roomState.gameData?.milestone.name === "round";
                if ((host === undefined || !host.isOnline) && !inRound) {
                    roomMetadata.hostLeftIteration++;
                    if (roomMetadata.hostLeftIteration >= 6) {
                        Utilitary.destroyRoom(bot, room);
                    }
                } else {
                    roomMetadata.hostLeftIteration = 0;
                }
            }
        },
    },
    {
        intervalInMs: 5000,
        setIntervalTimeout: undefined,
        setTimeoutTimeout: undefined,
        fn: async (ctx) => {
            const bot = ctx.bot as BirdBot;
            const currentMainRoomLanguages = Object.entries(bot.rooms)
                .filter(([, room]) => {
                    return room.constantRoomData.roomCreatorAuthId === null;
                })
                .map(([, room]) => {
                    return room.roomState.gameData?.rules.dictionaryId;
                })
                .filter((lang) => lang !== undefined && lang in dictionaryIdToBirdbotLanguage)
                .map((lang) => dictionaryIdToBirdbotLanguage[lang as BirdBotSupportedDictionaryId]);

            const missingMainRoomLanguages = bot.mainRoomLanguages.filter((language) => {
                return !currentMainRoomLanguages.includes(language);
            });
            if (missingMainRoomLanguages[0]) {
                Logger.log({
                    message: `Creating main room for language ${missingMainRoomLanguages[0]}`,
                    path: "bot/src/bots/birdbot/BirdbotPeriodicTasks.ts",
                });
                await bot.createRoom({
                    roomCreatorAuthId: null,
                    targetConfig: {
                        dictionaryId: birdbotLanguageToDictionaryId[missingMainRoomLanguages[0]],
                        birdbotGameMode: "regular",
                        isPublic: true,
                        roomName: `🐤 BirdBot ${t(`lib.language.${missingMainRoomLanguages[0]}.flag`, { lng: "en" })}`,
                    },
                });
            }
        },
    },
    {
        intervalInMs: 1000 * 3,
        setIntervalTimeout: undefined,
        setTimeoutTimeout: undefined,
        fn: (ctx) => {
            const { bot } = ctx;
            const rooms = Object.values(bot.rooms);
            for (const room of rooms) {
                if (!room.isConnected()) {
                    room.roomState.lastActivityAt = room.roomState.lastActivityAt || Date.now();
                    if (Date.now() - room.roomState.lastActivityAt > 12000) {
                        Logger.log({
                            message: `Room ${room.id} appears to be dead. Destroying...`,
                            path: "bot/src/bots/birdbot/BirdbotPeriodicTasks.ts",
                        });
                        Utilitary.destroyRoom(bot, room);
                    }
                    continue;
                }
                if (Date.now() - room.roomState.lastActivityAt > 60000) {
                    // Socket still reports connected but no events — keep alive via activity touch on any event
                    room.roomState.lastActivityAt = Date.now();
                }
            }
        },
    },
    {
        intervalInMs: 30 * 1000,
        setIntervalTimeout: undefined,
        setTimeoutTimeout: undefined,
        fn: async (ctx) => {
            const languages = languageEnumSchema.options satisfies BirdBotLanguage[];
            for (const language of languages) {
                let dictionaryResource: DictionaryResource | undefined;
                try {
                    dictionaryResource = ctx.bot.resourceManager.get<DictionaryResource>(`dictionary-${language}`);
                } catch (e) {
                    continue;
                }
                if (dictionaryResource.metadata.changed) {
                    dictionaryResource.metadata.changed = false;
                    const dictionaryMetadata = dictionaryResource.metadata;

                    Utilitary.insertionSort(dictionaryResource.resource, (a, b) => a.localeCompare(b));

                    await writeFile(dictionaryMetadata.resourceFilePath, dictionaryResource.resource.join("\n"));

                    const dictionaryHash = BirdBotUtils.getDictionaryHash(dictionaryResource);

                    await writeFile(
                        dictionaryMetadata.metadataFilePath,
                        [
                            dictionaryHash,
                            JSON.stringify({
                                letterRarityScores: dictionaryMetadata.letterRarityScores,
                                syllablesCount: dictionaryMetadata.syllablesCount,
                                topFlipWords: dictionaryMetadata.topFlipWords,
                                topSnWords: dictionaryMetadata.topSnWords,
                            } satisfies CacheableDictionaryMetadata),
                        ].join("\n")
                    );

                    return;
                }
            }
        },
    },
    {
        intervalInMs: 1000 * 60 * 90,
        offsetInMs: 1000 * 60 * (90 / 2),
        setIntervalTimeout: undefined,
        setTimeoutTimeout: undefined,
        fn: (ctx) => {
            const { bot } = ctx;
            const rooms = Object.values(bot.rooms);
            for (const room of rooms) {
                const roomLanguage = room.roomState.gameData?.rules.dictionaryId;
                if (roomLanguage === undefined) continue;
                const roomBirdBotLanguage = dictionaryIdToBirdbotLanguage[roomLanguage as BirdBotSupportedDictionaryId];
                if (!roomBirdBotLanguage) continue;
                const messageContent = t(`periodic.support.star`, { lng: roomBirdBotLanguage });
                Utilitary.sendChatMessage(room, messageContent);
            }
        },
    },
    {
        intervalInMs: 1000 * 60 * 90,
        setIntervalTimeout: undefined,
        setTimeoutTimeout: undefined,
        fn: (ctx) => {
            const { bot } = ctx;
            const rooms = Object.values(bot.rooms);
            for (const room of rooms) {
                const roomLanguage = room.roomState.gameData?.rules.dictionaryId;
                if (roomLanguage === undefined) continue;
                const roomBirdBotLanguage = dictionaryIdToBirdbotLanguage[roomLanguage as BirdBotSupportedDictionaryId];
                if (!roomBirdBotLanguage) continue;
                const messageContent = t(`periodic.support.donate`, { lng: roomBirdBotLanguage });
                Utilitary.sendChatMessage(room, messageContent);
            }
        },
    },
];
