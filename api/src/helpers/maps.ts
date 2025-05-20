import {
    Prisma,
    GameMode as PrismaGameMode,
    Language as PrismaLanguage,
    SubmitResultType as PrismaSubmitResultType,
} from "@prisma/client";
import { type TLanguage, type TMode, type TRecord } from "../schemas/records.zod";
import { TSubmitResult } from "../schemas/word.zod";

export const recordEnumToDatabaseFieldMap = {
    alpha: Prisma.GameRecapScalarFieldEnum.alpha_count,
    depleted_syllables: Prisma.GameRecapScalarFieldEnum.depleted_syllables_count,
    word: Prisma.GameRecapScalarFieldEnum.words_count,
    multi_syllable: Prisma.GameRecapScalarFieldEnum.multi_syllables_count,
    previous_syllable: Prisma.GameRecapScalarFieldEnum.previous_syllables_count,
    flips: Prisma.GameRecapScalarFieldEnum.flips_count,
    hyphen: Prisma.GameRecapScalarFieldEnum.hyphen_words_count,
    no_death: Prisma.GameRecapScalarFieldEnum.words_without_death_count,
    more_than_20_letters: Prisma.GameRecapScalarFieldEnum.more_than_20_letters_words_count,
    time: "time", // TODO: Add time
} satisfies { [key in TRecord]: Prisma.GameRecapScalarFieldEnum | "time" };

export type GameRecapRecordField = Exclude<Prisma.GameRecapScalarFieldEnum, "id" | "game_id" | "player_id" | "died_at"> | "time";

export const databaseFieldToRecordEnumMap = {
    alpha_count: "alpha",
    depleted_syllables_count: "depleted_syllables",
    words_count: "word",
    multi_syllables_count: "multi_syllable",
    previous_syllables_count: "previous_syllable",
    flips_count: "flips",
    hyphen_words_count: "hyphen",
    words_without_death_count: "no_death",
    more_than_20_letters_words_count: "more_than_20_letters",
    time: "time",
} satisfies { [key in GameRecapRecordField]: TRecord };

export const languageEnumToDatabaseEnumMap = {
    fr: PrismaLanguage.FR,
    en: PrismaLanguage.EN,
    de: PrismaLanguage.DE,
    es: PrismaLanguage.ES,
    brpt: PrismaLanguage.BRPT,
    it: PrismaLanguage.IT,
} satisfies { [key in TLanguage]: PrismaLanguage };

export const databaseEnumToLanguageEnumMap = {
    FR: "fr",
    EN: "en",
    DE: "de",
    ES: "es",
    BRPT: "brpt",
    IT: "it",
} satisfies { [key in PrismaLanguage]: TLanguage };

export const databaseEnumToModeEnumMap = {
    REGULAR: "regular",
    EASY: "easy",
    BLITZ: "blitz",
    SUB500: "sub500",
    SUB50: "sub50",
    FREEPLAY: "freeplay",
} satisfies { [key in PrismaGameMode]: TMode };

export const modeEnumToDatabaseEnumMap = {
    regular: PrismaGameMode.REGULAR,
    easy: PrismaGameMode.EASY,
    blitz: PrismaGameMode.BLITZ,
    sub500: PrismaGameMode.SUB500,
    sub50: PrismaGameMode.SUB50,
    freeplay: PrismaGameMode.FREEPLAY,
} satisfies { [key in TMode]: PrismaGameMode };

export const submitResultEnumToDatabaseEnumMap = {
    success: PrismaSubmitResultType.SUCCESS,
    failsPrompt: PrismaSubmitResultType.FAILS_PROMPT,
    invalidWord: PrismaSubmitResultType.INVALID_WORD,
    noText: PrismaSubmitResultType.NO_TEXT,
    alreadyUsed: PrismaSubmitResultType.ALREADY_USED,
    bombExploded: PrismaSubmitResultType.BOMB_EXPLODED,
} satisfies { [key in TSubmitResult]: PrismaSubmitResultType };

export { PrismaGameMode, PrismaLanguage, PrismaSubmitResultType };
