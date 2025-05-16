import { writeFile } from "fs/promises";
import { type PeriodicTask } from "../../lib/class/Bot.class";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import BirdBot from "./BirdBot.class";
import {
    birdbotLanguageToDictionaryId,
    dictionaryIdToBirdbotLanguage,
    languageEnumSchema,
} from "./BirdBotConstants";
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
        timeout: undefined,
        fn: (ctx) => {
            const { bot } = ctx;
            for (const roomId in bot.rooms) {
                const room = bot.rooms[roomId];
                const hostName = room.constantRoomData.roomCreatorUsername;
                const roomMetadata = room.roomState
                    .metadata as BirdBotRoomMetadata;
                const gamers = room.roomState.roomData?.gamers;

                if (!room.ws || room.ws.readyState !== WebSocket.OPEN) continue;
                if (roomMetadata.hostLeftIteration === undefined) continue;
                if (gamers === undefined) continue;
                if (hostName === null) continue;

                const host = gamers.find(
                    (gamer) => gamer.identity.name === hostName
                );
                if (
                    (host === undefined || !host.isOnline) &&
                    room.roomState.gameData?.round.state.value !== "round"
                ) {
                    // Host left the room
                    roomMetadata.hostLeftIteration++;
                    if (roomMetadata.hostLeftIteration >= 6) {
                        // Host left the room for more than 6 iterations (60 seconds)
                        // We need to destroy the room
                        Utilitary.destroyRoom(bot, room);
                    }
                } else {
                    // Host is present, reset the counter
                    roomMetadata.hostLeftIteration = 0;
                }
            }
        },
    },
    {
        intervalInMs: 5000,
        timeout: undefined,
        fn: async (ctx) => {
            const bot = ctx.bot as BirdBot;
            const currentMainRoomLanguages = Object.entries(bot.rooms)
                .filter(([roomId, room]) => {
                    return room.constantRoomData.roomCreatorUsername === null;
                })
                .map(([roomId, room]) => {
                    return room.roomState.gameData?.rules.dictionaryId;
                })
                .filter(
                    (lang) =>
                        lang !== undefined &&
                        lang in dictionaryIdToBirdbotLanguage
                )
                .map(
                    (lang) =>
                        dictionaryIdToBirdbotLanguage[
                            lang as BirdBotSupportedDictionaryId
                        ]
                );

            const missingMainRoomLanguages = bot.mainRoomLanguages.filter(
                (language) => {
                    return !currentMainRoomLanguages.includes(language);
                }
            );
            if (missingMainRoomLanguages[0]) {
                Logger.log({
                    message: `Creating main room for language ${missingMainRoomLanguages[0]}`,
                    path: "bot/src/bots/birdbot/BirdbotPeriodicTasks.ts",
                });
                await bot.createRoom({
                    roomCreatorUsername: null,
                    targetConfig: {
                        dictionaryId:
                            birdbotLanguageToDictionaryId[
                                missingMainRoomLanguages[0]
                            ],
                        gameMode: "survival",
                        birdbotGameMode: "regular",
                        isPublic: true,
                        roomName: `🐤 BirdBot ${t(
                            `lib.language.${missingMainRoomLanguages[0]}.flag`,
                            { lng: "en" }
                        )}`,
                    },
                });
            }
        },
    },
    {
        intervalInMs: 1000 * 3,
        timeout: undefined,
        fn: (ctx) => {
            const { bot } = ctx;
            const rooms = Object.values(bot.rooms);
            for (const room of rooms) {
                room.roomState.unansweredPings++;
                if (room.roomState.unansweredPings >= 4) {
                    Logger.log({
                        message: `Room ${room.id} appears to be dead. Destroying...`,
                        path: "bot/src/bots/birdbot/BirdbotPeriodicTasks.ts",
                    });
                    Utilitary.destroyRoom(bot, room);
                    continue;
                }

                const ws = room.ws;
                if (!ws || ws.readyState !== WebSocket.OPEN) continue;
                ws.listeners("pong").forEach((listener) => {
                    ws.off("pong", listener as any);
                });
                ws.once("pong", () => {
                    // Logger.log({
                    //     message: `Room ${room.id} received pong. Resetting unanswered pings counter.`,
                    //     path: "bot/src/bots/birdbot/BirdbotPeriodicTasks.ts",
                    // });
                    room.roomState.unansweredPings = 0;
                });
                ws.ping();
            }
        },
    },
    {
        intervalInMs: 30 * 1000,
        timeout: undefined,
        fn: async (ctx) => {
            const languages =
                languageEnumSchema.options satisfies BirdBotLanguage[];
            for (const language of languages) {
                let dictionaryResource: DictionaryResource | undefined;
                try {
                    dictionaryResource =
                        ctx.bot.resourceManager.get<DictionaryResource>(
                            `dictionary-${language}`
                        );
                } catch (e) {
                    continue;
                }
                if (dictionaryResource.metadata.changed) {
                    dictionaryResource.metadata.changed = false;
                    const dictionaryMetadata = dictionaryResource.metadata;

                    Utilitary.insertionSort(
                        dictionaryResource.resource,
                        (a, b) => a.localeCompare(b)
                    );

                    await writeFile(
                        dictionaryMetadata.resourceFilePath,
                        dictionaryResource.resource.join("\n")
                    );

                    const dictionaryHash =
                        BirdBotUtils.getDictionaryHash(dictionaryResource);

                    await writeFile(
                        dictionaryMetadata.metadataFilePath,
                        [
                            dictionaryHash,
                            JSON.stringify({
                                letterRarityScores:
                                    dictionaryMetadata.letterRarityScores,
                                syllablesCount:
                                    dictionaryMetadata.syllablesCount,
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
];
