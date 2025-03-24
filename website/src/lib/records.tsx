import { BookOpenIcon, ClockIcon } from "@heroicons/react/24/outline";
import React from "react";

export enum RecordsEnum {
    WORDS = "words",
    TIME = "time",
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
    getIcon: (classes: string) => React.ReactElement;
}

interface ILanguageData {
    displayName: string;
    shortDisplayName: string;
}

interface IGameModeData {
    displayName: string;
}

export const RECORDS_DATA: { [key in RecordsEnum]: IRecordData } = {
    time: { displayName: "Time", getIcon: (classes) => <ClockIcon className={classes} /> },
    words: { displayName: "Words", getIcon: (classes) => <BookOpenIcon className={classes} /> },
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
