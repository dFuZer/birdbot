import { z } from "zod";
import { playerSchema } from "./player.zod";

let languages = z.enum(["FR", "EN", "DE", "ES", "BRPT"]);
let modes = z.enum(["REGULAR", "EASY", "BLITZ", "SUB500", "SUB50", "FREEPLAY"]);

let gameSchema = z.object({
    id: z.string().max(50),
    lang: languages,
    mode: modes,
});

let gameRecap = z.object({
    game: gameSchema,
    player: playerSchema,

    // Non-listed records
    startTimestamp: z.number(),
    endTimestamp: z.number(),
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
