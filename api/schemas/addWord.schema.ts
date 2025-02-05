import { z } from "zod";
import { playerSchema } from "./addPlayer.schema";

let addWordSchema = z.object({
    player: playerSchema,
    gameId: z.string().uuid(),
    word: z.string().max(30),
    flip: z.boolean(),
    correct: z.boolean(),
    prompt: z.string().max(10),
});

export { addWordSchema };
