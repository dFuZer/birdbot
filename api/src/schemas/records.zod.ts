import { z } from "zod";
import { numericString } from "./common.zod";

const languageEnumSchema = z.enum(["fr", "en", "de", "es", "brpt", "it"]);
const modeEnumSchema = z.enum(["regular", "easy", "blitz", "sub500", "sub50", "freeplay"]);
const recordsEnumSchema = z.enum([
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

type TLanguage = z.infer<typeof languageEnumSchema>;
type TMode = z.infer<typeof modeEnumSchema>;
type TRecord = z.infer<typeof recordsEnumSchema>;

const defaultLanguage = languageEnumSchema.Values.en;
const defaultMode = modeEnumSchema.Values.regular;

let getRecords = z
    .object({
        lang: languageEnumSchema,
        mode: modeEnumSchema,
        record: recordsEnumSchema,
        page: numericString.optional(),
        perPage: numericString.optional(),
    })
    .or(
        z.object({
            lang: languageEnumSchema,
            mode: modeEnumSchema,
        })
    );

export {
    defaultLanguage,
    defaultMode,
    getRecords,
    languageEnumSchema,
    modeEnumSchema,
    recordsEnumSchema,
    type TLanguage,
    type TMode,
    type TRecord,
};
