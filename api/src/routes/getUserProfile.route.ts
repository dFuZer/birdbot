import type { WebsiteSession, WebsiteUser, WebsiteUserToPlayer, WebsiteUserToPlayerToken } from "@prisma/client";
import type { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { getLevelDataFromXp } from "../helpers/xp";
import prisma from "../prisma";

export let getUserProfileRouteHandler: RouteHandlerMethod = async function (req, res) {
    const requestQuery = req.query;
    const parsedData = z
        .object({
            sessionToken: z.string(),
        })
        .safeParse(requestQuery);

    if (!parsedData.success) {
        return res.status(400).send({ message: "Invalid params" });
    }

    const { sessionToken } = parsedData.data;

    const sessionsQuery: WebsiteSession[] = await prisma.$queryRaw`
        SELECT * FROM website_session
        WHERE session_token = ${sessionToken}
        LIMIT 1;
    `;

    if (sessionsQuery.length === 0) {
        return res.status(401).send({ message: "Invalid session token" });
    }

    const session = sessionsQuery[0];

    const usersQuery: WebsiteUser[] = await prisma.$queryRaw`
        SELECT * FROM website_user
        WHERE id = ${session.website_user_id}::UUID
        LIMIT 1;
    `;

    if (usersQuery.length === 0) {
        return res.status(401).send({ message: "Invalid session token" });
    }

    const user = usersQuery[0];

    const userToPlayerQuery: Promise<WebsiteUserToPlayer[]> = prisma.$queryRaw`
        SELECT * FROM website_user_to_player
        WHERE website_user_id = ${user.id}::UUID
        LIMIT 1;
    `;

    const userTokenQuery: Promise<WebsiteUserToPlayerToken[]> = prisma.$queryRaw`
        SELECT * FROM website_user_to_player_token
        WHERE website_user_id = ${user.id}::UUID
        LIMIT 1;
    `;

    const [userToPlayer, userToken] = await Promise.all([userToPlayerQuery, userTokenQuery]);
    type PlayerData = { id: string; username: string; xp: number };
    let player: PlayerData | undefined = undefined;

    if (userToPlayer.length > 0) {
        const playerId = userToPlayer[0].player_id;

        const playerQuery: PlayerData[] = await prisma.$queryRaw`
            SELECT p.id, p.account_name, p.xp, p.metadata->>'latest_username' as username
            FROM player p
            WHERE p.id = ${playerId}::UUID
            LIMIT 1;
        `;

        if (playerQuery.length > 0) {
            player = playerQuery[0];
        }
    }

    return res.status(200).send({
        playerData: player
            ? {
                  id: player.id,
                  username: player.username,
                  xp: getLevelDataFromXp(player.xp),
              }
            : undefined,
        linkingToken: userToken.length > 0 ? userToken[0].token : undefined,
        websiteUserData: {
            avatarUrl: `https://cdn.discordapp.com/avatars/${user.oauth_identifier}/${user.oauth_avatar}.jpg?size=1024`,
            username: user.oauth_username,
            provider: user.oauth_provider,
            globalName: user.oauth_global_name,
        },
    });
};
