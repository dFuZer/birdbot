import type NetworkAdapter from "../../lib/abstract/NetworkAdapter.abstract.class";
import Bot from "../../lib/class/Bot.class";
import Logger from "../../lib/class/Logger.class";
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
        const letterRarityScores = BirdBotUtils.getLetterRarityScores(words, dictionaryId);
        const et2 = performance.now();

        const st3 = performance.now();
        const syllablesCount = BirdBotUtils.getSyllablesCount(words);
        const et3 = performance.now();

        const st4 = performance.now();
        const topFlipWords = BirdBotUtils.getTopFlipWords(words, letterRarityScores, dictionaryId, 2000);
        const et4 = performance.now();

        const st5 = performance.now();
        const topSnWords = BirdBotUtils.getTopSnWords(words, syllablesCount, 2000);
        const et5 = performance.now();

        this.resourceManager.set<DictionaryResource>(key, {
            resource: words,
            metadata: {
                letterRarityScores,
                syllablesCount,
                topFlipWords,
                topSnWords,
            },
        });
        Logger.log({
            message: `Loaded words ${key} in ${et1 - st1}ms, rarity scores in ${et2 - st2}ms, syllables count in ${
                et3 - st3
            }ms, top flip words in ${et4 - st4}ms, top sn words in ${et5 - st5}ms`,
            path: "BirdBot.class.ts",
        });
    }
}
