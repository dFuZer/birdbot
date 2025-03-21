import { GameModesEnum, LanguagesEnum, RecordsEnum } from "@/records";
import { TPlayersPageSortMode } from "@/types";

type SearchParamOption = string | string[] | undefined;

export function isValidRecord(record: SearchParamOption): record is RecordsEnum {
    if (typeof record !== "string") return false;
    return Object.keys(RecordsEnum).includes(record);
}

export function isValidGameMode(mode: SearchParamOption): mode is GameModesEnum {
    if (typeof mode !== "string") return false;
    return Object.keys(GameModesEnum).includes(mode);
}

export function isValidLanguage(language: SearchParamOption): language is LanguagesEnum {
    if (typeof language !== "string") return false;
    return Object.keys(LanguagesEnum).includes(language);
}

export function isValidPlayersPageSortParam(sortParam: SearchParamOption): sortParam is TPlayersPageSortMode {
    return sortParam === "experience" || sortParam === "records";
}
