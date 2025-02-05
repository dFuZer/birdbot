import { PrismaClient } from "@prisma/client";
import type { RouteHandlerMethod } from "fastify";
import { addWordSchema } from "../schemas/addWord.schema";

let prisma = new PrismaClient();

export let addWordRouteHandler: RouteHandlerMethod = async function (req, res) {
    let wordData = req.body;
    let parsed = addWordSchema.safeParse(wordData);
    if (!parsed.success) {
        return res.status(400).send({ message: "Invalid input!" });
    }
    await prisma.word.create({
        data: {
            word: parsed.data.word,
            player: {
                connectOrCreate: {
                    create: {
                        authId: parsed.data.player.authId,
                        authProvider: parsed.data.player.authProvider,
                        authNickname: parsed.data.player.authNickname,
                        nickname: parsed.data.player.nickname,
                    },
                    where: {
                        id: parsed.data.player.authId,
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
