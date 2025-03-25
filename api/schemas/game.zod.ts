import { z } from "zod";

let languages = z.enum(["FR", "EN", "DE", "ES", "BRPT"]);
let modes = z.enum(["REGULAR", "EASY", "BLITZ", "SUB500", "SUB50", "FREEPLAY"]);

let gameSchema = z.object({
    id: z.string().max(50),
    lang: languages,
    mode: modes,
});

export { gameSchema };
