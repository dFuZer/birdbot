import { z } from "zod";

export const languageEnumSchema = z.enum(["fr", "en", "de", "es", "brpt"]);
export const modesEnumSchema = z.enum(["regular", "easy", "blitz", "sub500", "sub50", "freeplay"]);
export const recordsEnumSchema = z.enum([
    "word",
    "time",
    "multi_syllable",
    "previous_syllable",
    "flips",
    "depleted_syllables",
    "no_death",
    "alpha",
    "hyphen",
    "more_than_20_letters",
]);

export type LanguageEnum = z.infer<typeof languageEnumSchema>;
export type ModesEnum = z.infer<typeof modesEnumSchema>;
export type RecordsEnum = z.infer<typeof recordsEnumSchema>;

interface IRecordData {
    displayName: string;
}

interface ILanguageData {
    displayName: string;
    shortDisplayName: string;
}

interface IGameModeData {
    displayName: string;
}

export const RECORDS_DATA: { [key in RecordsEnum]: IRecordData } = {
    time: { displayName: "Time" },
    word: { displayName: "Words" },
    multi_syllable: { displayName: "Multi-syllable" },
    previous_syllable: { displayName: "Previous syllable" },
    flips: { displayName: "Flips" },
    depleted_syllables: { displayName: "Depleted syllables" },
    no_death: { displayName: "No death" },
    alpha: { displayName: "Alpha" },
    hyphen: { displayName: "Hyphen" },
    more_than_20_letters: { displayName: "More than 20 letters" },
};

export const GAME_MODES_DATA: { [key in ModesEnum]: IGameModeData } = {
    regular: { displayName: "Regular" },
    blitz: { displayName: "Blitz" },
    easy: { displayName: "Easy" },
    sub500: { displayName: "Sub 500" },
    sub50: { displayName: "Sub 50" },
    freeplay: { displayName: "Freeplay" },
};

export const LANGUAGES_DATA: { [key in LanguageEnum]: ILanguageData } = {
    en: { displayName: "English", shortDisplayName: "EN" },
    fr: { displayName: "French", shortDisplayName: "FR" },
    de: { displayName: "German", shortDisplayName: "DE" },
    brpt: { displayName: "BRPT", shortDisplayName: "BRPT" },
    es: { displayName: "Spanish", shortDisplayName: "ES" },
};
