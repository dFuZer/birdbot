import type { RouteHandlerMethod } from "fastify";
import addGameIfNotExist from "../helpers/addGameIfNotExist";
import addPlayerIfNotExist from "../helpers/addPlayerIfNotExist";
import Logger from "../lib/logger";
import prisma from "../prisma/client";
import { addWordSchema } from "../schemas/word.zod";

export let addWordRouteHandler: RouteHandlerMethod = async function (req, res) {
    Logger.log({ message: "-- addWord route handler --", path: "addWord.route.ts" });
    let requestJson = req.body;
    let parsed = addWordSchema.safeParse(requestJson);
    if (!parsed.success) {
        Logger.error({ message: "Input rejected by Zod", path: "addWord.route.ts", errorType: "zod", error: parsed.error });
        return res.status(400).send({ message: "Invalid input!" });
    }
    const wordData = parsed.data;
    Logger.log({ message: `Trying to insert new word`, path: "addWord.route.ts", json: { wordData } });
    try {
        const [player, game] = await Promise.all([addPlayerIfNotExist(wordData.player), addGameIfNotExist(wordData.game)]);
        Logger.log({ message: `Inserting new word`, path: "addWord.route.ts" });
        await prisma.$executeRaw`
            INSERT INTO word (id, word, player_id, game_id)
            VALUES (gen_random_uuid(), ${wordData.word}, ${player.id}::UUID, ${game.id}::UUID)
        `;
        return res.status(200).send({ message: "Word added successfully" });
    } catch (e) {
        Logger.error({ message: "Failed to add word", path: "addWord.route.ts", errorType: "unknown", error: e });
        return res.status(500).send({ message: "Failed to add word" });
    }
};
