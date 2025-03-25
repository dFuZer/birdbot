import { randomUUIDv7 } from "bun";
import type { RouteHandlerMethod } from "fastify";
import Logger from "../lib/logger";
import prisma from "../prisma/client";
import { addWordSchema } from "../schemas/word.zod";

export let addWordRouteHandler: RouteHandlerMethod = async function (req, res) {
    let requestJson = req.body;
    let parsed = addWordSchema.safeParse(requestJson);
    if (!parsed.success) {
        Logger.error({ message: "Input rejected by Zod", path: "addWord.route.ts", errorType: "zod", error: parsed.error });
        return res.status(400).send({ message: "Invalid input!" });
    }
    const wordData = parsed.data;
    try {
        const gameQuery: Promise<{ id: string }[]> = prisma.$queryRaw`SELECT id FROM game WHERE id = ${wordData.game.id}::UUID`;
        const playerQuery: Promise<{ id: string }[]> = prisma.$queryRaw`SELECT id FROM player WHERE auth_id = ${wordData.player.authId}`;

        const [games, players] = await Promise.all([gameQuery, playerQuery]);
        const game = games[0];
        let player = players[0];
        if (!game) {
            Logger.log({ message: `Inserting a new game: ${wordData.game.id}, ${wordData.game.lang}, ${wordData.game.mode}`, path: "addWord.route.ts" });
            await prisma.$executeRaw`
                INSERT INTO game (id, "language", mode)
                VALUES (${wordData.game.id}::UUID, ${wordData.game.lang}::"language", ${wordData.game.mode}::"game_mode")
            `;
        }
        if (!player) {
            const newPlayerId = randomUUIDv7();
            Logger.log({ message: `Inserting a new player: ${newPlayerId}, ${wordData.player.authNickname}, ${wordData.player.authProvider}, ${wordData.player.authId}`, path: "addWord.route.ts" });
            await prisma.$executeRaw`
                INSERT INTO player (id, auth_nickname, auth_provider, auth_id)
                VALUES (${newPlayerId}::UUID, ${wordData.player.authNickname}, ${wordData.player.authProvider}, ${wordData.player.authId})
            `;
            player = { id: newPlayerId };
        }

        Logger.log({ message: `Inserting new word: ${wordData.word}, playerId: ${player.id}, gameId: ${wordData.game.id}`, path: "addWord.route.ts" });
        await prisma.$executeRaw`
            INSERT INTO word (id, word, player_id, game_id)
            VALUES (gen_random_uuid(), ${wordData.word}, ${player.id}::UUID, ${wordData.game.id}::UUID)
        `;
        return res.status(200).send({ message: "Word added successfully" });
    } catch (e) {
        Logger.error({ message: "Failed to add word", path: "addWord.route.ts", errorType: "unknown", error: e });
        return res.status(500).send({ message: "Failed to add word" });
    }
};
