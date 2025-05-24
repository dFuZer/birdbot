import { WebsiteUserToPlayerToken } from "@prisma/client";
import { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import addPlayerIfNotExist from "../helpers/addPlayerIfNotExist";
import prisma from "../prisma";

export let linkAccountRouteHandler: RouteHandlerMethod = async function (req, res) {
    const parsedData = z
        .object({
            token: z.string(),
            accountName: z.string(),
            currentNickname: z.string(),
        })
        .safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).send({ message: "Invalid body" });
    }

    const player = await addPlayerIfNotExist({
        accountName: parsedData.data.accountName,
        nickname: parsedData.data.currentNickname,
    });

    const tokens = await prisma.$queryRaw<WebsiteUserToPlayerToken[]>`
        SELECT * FROM website_user_to_player_token
        WHERE token = ${parsedData.data.token}
    `;

    if (tokens.length === 0) {
        return res.status(404).send({ message: "Token not found" });
    }

    await prisma.$executeRaw`
        INSERT INTO website_user_to_player (website_user_id, player_id)
        VALUES (${tokens[0].website_user_id}::UUID, ${player.id}::UUID)
    `;

    await prisma.$executeRaw`
        DELETE FROM website_user_to_player_token
        WHERE id = ${tokens[0].id}::UUID
    `;

    return res.status(200).send({ message: "Account linked" });
};
