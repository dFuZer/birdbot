import { z } from "zod";

let playerSchema = z.object({
    accountName: z.string().max(50),
    nickname: z.string().max(50),
});

let addPlayersSchema = playerSchema.array();

export { addPlayersSchema, playerSchema };
