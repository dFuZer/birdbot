import { z } from "zod";
import { numericString } from "./common.zod";

let languages = z.enum(["FR", "EN", "DE", "ES", "BRPT"]);
let modes = z.enum(["REGULAR", "EASY", "BLITZ", "SUB500", "SUB50", "FREEPLAY"]);
let records = z.enum(["WORD", "TIME", "MULTI_SYLLABLE", "PREVIOUS_SYLLABLE", "FLIPS", "DEPLETED_SYLLABLES", "NO_DEATH", "ALPHA", "HYPHEN", "MORE_THAN_20_LETTERS"]);

type TLanguage = z.infer<typeof languages>;
type TMode = z.infer<typeof modes>;
type TRecord = z.infer<typeof records>;

let getRecords = z.object({
    lang: languages,
    mode: modes,
    record: records,
    page: numericString,
    perPage: numericString,
});

export { getRecords, languages, modes, records, type TLanguage, type TMode, type TRecord };
