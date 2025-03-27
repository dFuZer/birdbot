import { SearchParamOption } from "@/lib/params";
import { z } from "zod";
import {
    languageEnumSchema,
    modesEnumSchema,
    recordsEnumSchema,
    type LanguageEnum,
    type ModesEnum,
    type RecordsEnum,
} from "./records";

export const sortModeEnumSchema = z.enum(["experience", "records"]);
export type SortModeEnum = z.infer<typeof sortModeEnumSchema>;

export function isValidRecordParam(record: SearchParamOption): record is RecordsEnum {
    return recordsEnumSchema.safeParse(record).success;
}

export function isValidGameModeParam(mode: SearchParamOption): mode is ModesEnum {
    return modesEnumSchema.safeParse(mode).success;
}

export function isValidLanguageParam(language: SearchParamOption): language is LanguageEnum {
    return languageEnumSchema.safeParse(language).success;
}

export function isValidPlayersPageSortParam(sortParam: SearchParamOption): sortParam is SortModeEnum {
    return sortModeEnumSchema.safeParse(sortParam).success;
}
