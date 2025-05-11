import i18next, { type Resource } from "i18next";
import { CommandOrEventCtx } from "../../../lib/class/CommandUtils.class";
import { dictionaryIdToBirdbotLanguage } from "../BirdBotConstants";
import { BirdBotLanguage, BirdBotSupportedDictionaryId } from "../BirdBotTypes";
import { englishTexts } from "./englishTexts";
import { frenchTexts } from "./frenchTexts";
import { portugueseTexts } from "./portugueseTexts";
import { spanishTexts } from "./spanishTexts";

export const birdbotTextResource = {
    en: {
        translation: englishTexts,
    },
    fr: {
        translation: frenchTexts,
    },
    es: {
        translation: spanishTexts,
    },
    brpt: {
        translation: portugueseTexts,
    },
    de: {},
    it: {},
} satisfies Resource;

export function t(key: string, params?: { lng: BirdBotLanguage; [key: string]: string | number | undefined }) {
    return i18next.t([key, "error.missing_text"], params);
}

export function l(ctx: CommandOrEventCtx): BirdBotLanguage {
    const dictionaryId = ctx.room.roomState.gameData?.rules.dictionaryId;
    if (dictionaryId === undefined) {
        return "en";
    }
    return dictionaryIdToBirdbotLanguage[dictionaryId as BirdBotSupportedDictionaryId] ?? "en";
}
