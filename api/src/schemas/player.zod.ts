import { z } from "zod";

let playerSchema = z.object({
    authId: z.string().trim().min(1).max(50),
    nickname: z.string().max(50),
});

let addPlayersSchema = playerSchema.array();

export { addPlayersSchema, playerSchema };
