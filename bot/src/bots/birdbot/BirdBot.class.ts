import type NetworkAdapter from "../../lib/abstract/NetworkAdapter.abstract.class";
import Bot from "../../lib/class/Bot.class";
import type { DictionaryId } from "../../lib/types/gameTypes";
import birdbotEventHandlers from "./BirdBotEventHandlers";
import type { DictionaryResource } from "./BirdBotResources";
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
        const words = await this.resourceManager.loadArrayFromFile(path);
        this.resourceManager.set<DictionaryResource>(key, {
            resource: words,
            metadata: {
                letterRarityScores: BirdBotUtils.getLetterRarityScores(words, dictionaryId),
                syllablesCount: BirdBotUtils.getSyllablesCount(words),
            },
        });
    }
}
