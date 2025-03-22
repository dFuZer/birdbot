import { GameModesEnum, LanguagesEnum, RecordsEnum } from "@/records";
import { PlayersPageSortModeEnum } from "@/types";

type SearchParamOption = string | string[] | undefined;

export function isValidRecord(record: SearchParamOption): record is RecordsEnum {
    if (typeof record !== "string") return false;
    return (Object.values(RecordsEnum) as string[]).includes(record);
}

export function isValidGameMode(mode: SearchParamOption): mode is GameModesEnum {
    if (typeof mode !== "string") return false;
    return (Object.values(GameModesEnum) as string[]).includes(mode);
}

export function isValidLanguage(language: SearchParamOption): language is LanguagesEnum {
    if (typeof language !== "string") return false;
    return (Object.values(LanguagesEnum) as string[]).includes(language);
}

export function isValidPlayersPageSortParam(sortParam: SearchParamOption): sortParam is PlayersPageSortModeEnum {
    return sortParam === PlayersPageSortModeEnum.Experience || sortParam === PlayersPageSortModeEnum.Records;
}
