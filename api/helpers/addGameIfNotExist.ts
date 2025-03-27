import type { z } from "zod";
import Logger from "../lib/logger";
import prisma from "../prisma/client";
import type { gameSchema } from "../schemas/game.zod";

export default async function addGameIfNotExist(game: z.infer<typeof gameSchema>) {
    const gameResults: { id: string }[] = await prisma.$queryRaw`SELECT id FROM game WHERE id = ${game.id}::UUID`;
    const firstGame = gameResults[0];
    if (!firstGame) {
        Logger.log({ message: `Inserting a new game`, path: "addGameIfNotExist.ts" });
        await prisma.$executeRaw`
            INSERT INTO game (id, "language", mode)
            VALUES (${game.id}::UUID, ${game.lang}::"language", ${game.mode}::"game_mode")
        `;
    }
    return { id: game.id };
}
