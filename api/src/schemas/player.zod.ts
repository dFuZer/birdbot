import { z } from "zod";

let playerSchema = z.object({
    authId: z.string().max(50),
    authProvider: z.string().max(50),
    authNickname: z.string().max(50),
    nickname: z.string().max(50),
});

let addPlayersSchema = playerSchema.array();

export { addPlayersSchema, playerSchema };
