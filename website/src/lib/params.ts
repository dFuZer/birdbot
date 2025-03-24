import { GameModesEnum, LanguagesEnum, RecordsEnum } from "@/lib/records";

export enum PlayersPageSortModeEnum {
    Experience = "experience",
    Records = "records",
}

export type TSearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type SearchParamOption = string | string[] | undefined;

export function isValidRecordParam(record: SearchParamOption): record is RecordsEnum {
    if (typeof record !== "string") return false;
    return Object.values(RecordsEnum).includes(record as RecordsEnum);
}

export function isValidGameModeParam(mode: SearchParamOption): mode is GameModesEnum {
    if (typeof mode !== "string") return false;
    return Object.values(GameModesEnum).includes(mode as GameModesEnum);
}

export function isValidLanguageParam(language: SearchParamOption): language is LanguagesEnum {
    if (typeof language !== "string") return false;
    return Object.values(LanguagesEnum).includes(language as LanguagesEnum);
}

export function isValidPlayersPageSortParam(sortParam: SearchParamOption): sortParam is PlayersPageSortModeEnum {
    if (typeof sortParam !== "string") return false;
    return Object.values(PlayersPageSortModeEnum).includes(sortParam as PlayersPageSortModeEnum);
}
