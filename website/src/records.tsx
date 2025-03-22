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
}

export enum LanguagesEnum {
    ENGLISH = "english",
    FRENCH = "french",
    GERMAN = "german",
    BRPT = "brpt",
    SPANISH = "spanish",
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
};

export const LANGUAGES_DATA: { [key in LanguagesEnum]: ILanguageData } = {
    english: { displayName: "English", shortDisplayName: "EN" },
    french: { displayName: "French", shortDisplayName: "FR" },
    german: { displayName: "German", shortDisplayName: "DE" },
    brpt: { displayName: "BRPT", shortDisplayName: "BRPT" },
    spanish: { displayName: "Spanish", shortDisplayName: "ES" },
};
