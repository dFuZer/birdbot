import { z } from "zod";
import { playerSchema } from "./player.zod";
import { languageEnumSchema, modesEnumSchema } from "./records.zod";

let gameSchema = z.object({
    id: z.string().max(50),
    lang: languageEnumSchema,
    mode: modesEnumSchema,
});

let gameRecap = z.object({
    game: gameSchema,
    player: playerSchema,

    // Non-listed records
    diedAt: z.number(),
    wordsCount: z.number(),
    flipsCount: z.number(),
    depletedSyllablesCount: z.number(),
    alphaCount: z.number(),
    wordsWithoutDeathCount: z.number(),
    previousSyllablesCount: z.number(),
    multiSyllablesCount: z.number(),

    // Semi-listed records
    hyphenWordsCount: z.number(),
    moreThan20LettersWordsCount: z.number(),

    // Listed records
    // (None)
});

export { gameRecap, gameSchema };
