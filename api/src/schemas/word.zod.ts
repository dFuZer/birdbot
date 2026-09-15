import { z } from "zod";
import { gameSchema } from "./game.zod";
import { playerSchema } from "./player.zod";

const submitResultSchema = z.enum(["success", "failsPrompt", "invalidWord", "noText", "alreadyUsed", "bombExploded"]);
type TSubmitResult = z.infer<typeof submitResultSchema>;

let addWordSchema = z.object({
    player: playerSchema,
    game: gameSchema,
    word: z.string().max(50),
    flip: z.boolean(),
    submitResult: submitResultSchema,
    prompt: z.string().max(10),
    durationMs: z.number().int().nonnegative().max(3_600_000).optional(),
    reactionMs: z.number().int().nonnegative().max(3_600_000).optional(),
    idempotencyKey: z.string().trim().min(8).max(140),
});

export { addWordSchema, type TSubmitResult };
