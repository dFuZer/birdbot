import { createHash } from "crypto";
import type NetworkAdapter from "../../lib/abstract/NetworkAdapter.abstract.class";
import Bot from "../../lib/class/Bot.class";
import Logger from "../../lib/class/Logger.class";
import Utilitary from "../../lib/class/Utilitary.class";
import type { DictionaryId } from "../../lib/types/gameTypes";
import birdbotEventHandlers from "./BirdBotEventHandlers";
import type { DictionaryResource } from "./BirdBotTypes";
import BirdBotUtils from "./BirdBotUtils.class";
export default class BirdBot extends Bot {
    constructor({ networkAdapter }: { networkAdapter: NetworkAdapter }) {
        super({ handlers: birdbotEventHandlers, networkAdapter });
    }

    public async loadDictionaryResourceFromFile({
        key,
        path,
        dictionaryId,
    }: {
        key: string;
        path: string;
        dictionaryId: DictionaryId;
    }) {
        Logger.log({
            message: `Loading dictionary resource ${key} from file ${path} with dictionaryId ${dictionaryId}`,
            path: "BirdBot.class.ts",
        });

        const st1 = performance.now();
        const words = await this.resourceManager.loadArrayResourceFromFile(path);
        const et1 = performance.now();

        const st2 = performance.now();
        const resourceHash = createHash("sha256").update(words.concat(dictionaryId, key, path).join(" ")).digest("hex");
        const et2 = performance.now();

        const restoredResourceMetadataString = Utilitary.readFileInDataFolder(`${resourceHash}.json`);
        if (restoredResourceMetadataString) {
            try {
                const st3 = performance.now();
                const restoredMetadata = JSON.parse(restoredResourceMetadataString);
                const et3 = performance.now();
                this.resourceManager.set<DictionaryResource>(key, {
                    resource: words,
                    metadata: restoredMetadata,
                });
                Logger.log({
                    message: `Loaded words ${key} in ${Math.round(et1 - st1)}ms, hashed in ${Math.round(
                        et2 - st2
                    )}ms, restored metadata in ${Math.round(et3 - st3)}ms`,
                    path: "BirdBot.class.ts",
                });
            } catch (e) {
                Logger.error({
                    message: `An error occurred while restoring resource metadata for ${key}`,
                    path: "BirdBot.class.ts",
                    error: e,
                });
                process.exit(1);
            }
        } else {
            Logger.log({
                message: `Could not restore resource metadata for ${key}. Generating metadata, this may take a while...`,
                path: "BirdBot.class.ts",
            });
            const st3 = performance.now();
            const letterRarityScores = BirdBotUtils.getLetterRarityScores(words, dictionaryId);
            const et3 = performance.now();

            const st4 = performance.now();
            const syllablesCount = BirdBotUtils.getSyllablesCount(words);
            const et4 = performance.now();

            const st5 = performance.now();
            const topFlipWords = BirdBotUtils.getTopFlipWords(words, letterRarityScores, dictionaryId, 2000);
            const et5 = performance.now();

            const st6 = performance.now();
            const topSnWords = BirdBotUtils.getTopSnWords(words, syllablesCount, 2000);
            const et6 = performance.now();

            const metadata = {
                letterRarityScores,
                syllablesCount,
                topFlipWords,
                topSnWords,
            };

            Utilitary.writeFileInDataFolder(`${resourceHash}.json`, JSON.stringify(metadata, null, 2));

            this.resourceManager.set<DictionaryResource>(key, {
                resource: words,
                metadata,
            });
            Logger.log({
                message: `Loaded words ${key} in ${Math.round(et1 - st1)}ms, hashed in ${Math.round(
                    et2 - st2
                )}ms, letter rarity scores in ${Math.round(et3 - st3)}ms, syllables count in ${Math.round(
                    et4 - st4
                )}ms, top flip words in ${Math.round(et5 - st5)}ms, top sn words in ${Math.round(et6 - st6)}ms`,
                path: "BirdBot.class.ts",
            });
        }
    }
}
