import { z } from "zod";
import { playerSchema } from "./player.zod";
import { languageEnumSchema, modeEnumSchema } from "./records.zod";

let gameSchema = z.object({
    id: z.string().uuid(),
    lang: languageEnumSchema,
    mode: modeEnumSchema,
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
    slursCount: z.number(),
    creaturesCount: z.number(),
    ethnonymsCount: z.number(),
    chemicalsCount: z.number(),
    plantsCount: z.number(),
    foodsCount: z.number(),
    adverbsCount: z.number(),
});

export { gameRecap, gameSchema };
