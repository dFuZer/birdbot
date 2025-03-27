import { Prisma, GameMode as PrismaGameMode, Language as PrismaLanguage } from "@prisma/client";
import { type TLanguage, type TMode, type TRecord } from "../schemas/records.zod";

export type TOrderByField = Exclude<TRecord, "time">;

export const recordEnumToDatabaseFieldMap: { [key in TOrderByField]: Prisma.GameRecapScalarFieldEnum } = {
    alpha: Prisma.GameRecapScalarFieldEnum.alpha_count,
    depleted_syllables: Prisma.GameRecapScalarFieldEnum.depleted_syllables_count,
    word: Prisma.GameRecapScalarFieldEnum.words_count,
    multi_syllable: Prisma.GameRecapScalarFieldEnum.multi_syllables_count,
    previous_syllable: Prisma.GameRecapScalarFieldEnum.previous_syllables_count,
    flips: Prisma.GameRecapScalarFieldEnum.flips_count,
    hyphen: Prisma.GameRecapScalarFieldEnum.hyphen_words_count,
    no_death: Prisma.GameRecapScalarFieldEnum.words_without_death_count,
    more_than_20_letters: Prisma.GameRecapScalarFieldEnum.more_than_20_letters_words_count,
};

export const languageEnumToDatabaseEnumMap: { [key in TLanguage]: PrismaLanguage } = {
    fr: PrismaLanguage.FR,
    en: PrismaLanguage.EN,
    de: PrismaLanguage.DE,
    es: PrismaLanguage.ES,
    brpt: PrismaLanguage.BRPT,
};

export const modeEnumToDatabaseEnumMap: { [key in TMode]: PrismaGameMode } = {
    regular: PrismaGameMode.REGULAR,
    easy: PrismaGameMode.EASY,
    blitz: PrismaGameMode.BLITZ,
    sub500: PrismaGameMode.SUB500,
    sub50: PrismaGameMode.SUB50,
    freeplay: PrismaGameMode.FREEPLAY,
};
