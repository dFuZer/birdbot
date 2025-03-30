import { z } from "zod";
import { numericString } from "./common.zod";

const languageEnumSchema = z.enum(["fr", "en", "de", "es", "brpt"]);
const modesEnumSchema = z.enum(["regular", "easy", "blitz", "sub500", "sub50", "freeplay"]);
const recordsEnumSchema = z.enum(["word", "time", "multi_syllable", "previous_syllable", "flips", "depleted_syllables", "no_death", "alpha", "hyphen", "more_than_20_letters"]);

type TLanguage = z.infer<typeof languageEnumSchema>;
type TMode = z.infer<typeof modesEnumSchema>;
type TRecord = z.infer<typeof recordsEnumSchema>;

let getRecords = z.object({
    lang: languageEnumSchema,
    mode: modesEnumSchema,
    record: recordsEnumSchema,
    page: numericString,
    perPage: numericString,
});

export { getRecords, languageEnumSchema, modesEnumSchema, recordsEnumSchema, type TLanguage, type TMode, type TRecord };
