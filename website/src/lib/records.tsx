export enum RecordsEnum {
    WORDS = "words",
    TIME = "time",
    MULTI_SYLLABLE = "multi_syllable",
    PREVIOUS_SYLLABLE = "previous_syllable",
    FLIPS = "flips",
    DEPLETED_SYLLABLES = "depleted_syllables",
    NO_DEATH = "no_death",
    ALPHA = "alpha",
    HYPHEN = "hyphen",
    MORE_THAN_20_LETTERS = "more_than_20_letters",
}

export enum GameModesEnum {
    REGULAR = "regular",
    BLITZ = "blitz",
    EASY = "easy",
    SUB500 = "sub500",
    SUB50 = "sub50",
    FREEPLAY = "freeplay",
}

export enum LanguagesEnum {
    ENGLISH = "en",
    FRENCH = "fr",
    GERMAN = "de",
    BRPT = "brpt",
    SPANISH = "es",
}

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
    words: { displayName: "Words" },
    multi_syllable: { displayName: "Multi-syllable" },
    previous_syllable: { displayName: "Previous syllable" },
    flips: { displayName: "Flips" },
    depleted_syllables: { displayName: "Depleted syllables" },
    no_death: { displayName: "No death" },
    alpha: { displayName: "Alpha" },
    hyphen: { displayName: "Hyphen" },
    more_than_20_letters: { displayName: "More than 20 letters" },
};

export const GAME_MODES_DATA: { [key in GameModesEnum]: IGameModeData } = {
    regular: { displayName: "Regular" },
    blitz: { displayName: "Blitz" },
    easy: { displayName: "Easy" },
    sub500: { displayName: "Sub 500" },
    sub50: { displayName: "Sub 50" },
    freeplay: { displayName: "Freeplay" },
};

export const LANGUAGES_DATA: { [key in LanguagesEnum]: ILanguageData } = {
    en: { displayName: "English", shortDisplayName: "EN" },
    fr: { displayName: "French", shortDisplayName: "FR" },
    de: { displayName: "German", shortDisplayName: "DE" },
    brpt: { displayName: "BRPT", shortDisplayName: "BRPT" },
    es: { displayName: "Spanish", shortDisplayName: "ES" },
};
