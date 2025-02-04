import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import type { RouteHandlerMethod } from "fastify";

let AddWordSchema = z.object({
    word: z.string().max(30),
    playerAuthId: z.string(),
    gameId: z.string().uuid(),
});

let prisma = new PrismaClient();

export let addWordRouteHandler: RouteHandlerMethod = async function (req, res) {
    let wordData = req.body;
    let parsed = AddWordSchema.safeParse(wordData);
    if (!parsed.success) {
        return res.status(400).send({ message: "Invalid input!" });
    }
    await prisma.placedWord.create({
        data: {
            word: parsed.data.word,
            player: {
                connectOrCreate: {
                    create: {
                        id: parsed.data.playerAuthId,
                    },
                    where: {
                        id: parsed.data.playerAuthId,
                    },
                },
            },
            game: {
                connectOrCreate: {
                    create: {
                        id: parsed.data.gameId,
                    },
                    where: {
                        id: parsed.data.gameId,
                    },
                },
            },
        },
    });
    res.send({ message: "Word added!" });
};
