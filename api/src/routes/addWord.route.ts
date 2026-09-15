import type { RouteHandlerMethod } from "fastify";
import { Prisma } from "@prisma/client";
import addGameIfNotExist from "../helpers/addGameIfNotExist";
import addPlayerIfNotExist from "../helpers/addPlayerIfNotExist";
import { submitResultEnumToDatabaseEnumMap } from "../helpers/maps";
import Logger from "../lib/logger";
import prisma from "../prisma";
import { addWordSchema } from "../schemas/word.zod";

export let addWordRouteHandler: RouteHandlerMethod = async function (req, res) {
    Logger.log({ message: "-- addWord route handler --", path: "addWord.route.ts" });
    let requestJson = req.body;
    let parsed = addWordSchema.safeParse(requestJson);
    if (!parsed.success) {
        Logger.error({
            message: "Input rejected by Zod",
            path: "addWord.route.ts",
            errorType: "zod",
            error: parsed.error,
        });
        return res.status(400).send({ message: "Invalid input!" });
    }
    const wordData = parsed.data;
    Logger.log({ message: `Trying to insert new word`, path: "addWord.route.ts" });
    try {
        const existing = await prisma.word.findUnique({
            where: { idempotency_key: wordData.idempotencyKey },
            select: { id: true },
        });
        if (existing) {
            return res.status(200).send({ message: "Word already recorded", idempotent: true });
        }

        const [player, game] = await Promise.all([
            addPlayerIfNotExist(wordData.player),
            addGameIfNotExist(wordData.game),
        ]);
        Logger.log({ message: `Inserting new word`, path: "addWord.route.ts" });
        await prisma.word.create({
            data: {
                word: wordData.word,
                player_id: player.id,
                game_id: game.id,
                submit_result: submitResultEnumToDatabaseEnumMap[wordData.submitResult],
                prompt: wordData.prompt,
                flip: wordData.flip,
                duration_ms: wordData.durationMs ?? null,
                reaction_ms: wordData.reactionMs ?? null,
                idempotency_key: wordData.idempotencyKey,
            },
        });
        return res.status(200).send({ message: "Word added successfully" });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return res.status(200).send({ message: "Word already recorded", idempotent: true });
        }
        Logger.error({ message: "Failed to add word", path: "addWord.route.ts", errorType: "unknown", error: e });
        return res.status(500).send({ message: "Failed to add word" });
    }
};
