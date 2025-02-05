import { z } from "zod";

let playerSchema = z.object({
    authId: z.string(),
    authProvider: z.string(),
    authNickname: z.string().max(30),
    nickname: z.string().max(30),
});

let addPlayerSchema = playerSchema.array();

export { addPlayerSchema, playerSchema };
