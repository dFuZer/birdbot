import type { z } from "zod";
import Logger from "../lib/logger";
import prisma from "../prisma";
import type { gameSchema } from "../schemas/game.zod";
import { languageEnumToDatabaseEnumMap, modeEnumToDatabaseEnumMap } from "./maps";

export default async function addGameIfNotExist(game: z.infer<typeof gameSchema>) {
    const gameResults: { id: string }[] = await prisma.$queryRaw`SELECT id FROM game WHERE id = ${game.id}::UUID`;
    const firstGame = gameResults[0];
    if (!firstGame) {
        Logger.log({ message: `Inserting a new game`, path: "addGameIfNotExist.ts" });
        await prisma.$executeRaw`
            INSERT INTO game (id, "language", mode)
            VALUES (${game.id}::UUID, ${languageEnumToDatabaseEnumMap[game.lang]}::"language", ${
            modeEnumToDatabaseEnumMap[game.mode]
        }::"game_mode")
        `;
    }
    return { id: game.id };
}
