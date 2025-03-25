import { z } from "zod";
import { gameSchema } from "./game.zod";
import { playerSchema } from "./player.zod";

let addWordSchema = z.object({
    player: playerSchema,
    game: gameSchema,
    word: z.string().max(50),
    flip: z.boolean(),
    correct: z.boolean(),
    prompt: z.string().max(10),
});

export { addWordSchema };
