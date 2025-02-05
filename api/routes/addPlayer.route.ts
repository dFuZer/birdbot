import { PrismaClient } from "@prisma/client";
import type { RouteHandlerMethod } from "fastify";
import { addPlayerSchema } from "../schemas/addPlayer.schema";

let prisma = new PrismaClient();

export let addPlayerRouteHandler: RouteHandlerMethod = async function (req, res) {
    let playerData = req.body;
    let parsed = addPlayerSchema.safeParse(playerData);

    if (!parsed.success) {
        return res.status(400).send({ message: "Invalid input!" });
    }

    try {
        await prisma.$transaction(async (tx) => {
            await Promise.all(
                parsed.data.map((player) =>
                    tx.player.upsert({
                        where: {
                            id: player.authId,
                        },
                        create: {
                            authId: player.authId,
                            authProvider: player.authProvider,
                            authNickname: player.authNickname,
                            nickname: player.nickname,
                        },
                        update: {
                            authProvider: player.authProvider,
                            authNickname: player.authNickname,
                            nickname: player.nickname,
                        },
                    })
                )
            );
        });
        return res.status(200).send({ message: "Players added successfully" });
    } catch (error) {
        return res.status(500).send({ message: "Failed to add players" });
    }
};
