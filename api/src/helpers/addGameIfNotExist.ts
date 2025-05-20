import type { z } from "zod";
import Logger from "../lib/logger";
import prisma from "../prisma";
import type { gameSchema } from "../schemas/game.zod";
import { languageEnumToDatabaseEnumMap, modeEnumToDatabaseEnumMap } from "./maps";

export default async function addGameIfNotExist(game: z.infer<typeof gameSchema>) {
    const gameResults: { id: string; started_at: Date }[] =
        await prisma.$queryRaw`SELECT id, started_at FROM game WHERE id = ${game.id}::UUID`;
    const firstGame = gameResults[0];

    if (!firstGame) {
        Logger.log({ message: `Inserting a new game`, path: "addGameIfNotExist.ts" });
        const insertedResult: { id: string; started_at: Date }[] = await prisma.$queryRaw`
            INSERT INTO game (id, "language", mode)
            VALUES (${game.id}::UUID, ${languageEnumToDatabaseEnumMap[game.lang]}::"language", ${
                modeEnumToDatabaseEnumMap[game.mode]
            }::"game_mode")
        RETURNING id, started_at;
        `;
        return insertedResult[0];
    } else {
        return firstGame;
    }
}
