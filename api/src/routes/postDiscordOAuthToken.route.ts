import { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI } from "../env";
import { generatePlayerLinkToken, generateSessionToken } from "../helpers/crypto";
import prisma from "../prisma";

export let postDiscordOAuthToken: RouteHandlerMethod = async function (req, res) {
    const body = req.body;

    const parsedBody = z
        .object({
            code: z.string(),
        })
        .safeParse(body);

    if (!parsedBody.success) {
        return res.status(400).send({ message: "Invalid body" });
    }

    const { code } = parsedBody.data;

    const tokenResponse = await fetch(`https://discord.com/api/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            code,
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            redirect_uri: DISCORD_REDIRECT_URI,
            grant_type: "authorization_code",
        }),
    });

    if (!tokenResponse.ok) {
        return res.status(500).send({ message: "Failed to get token" });
    }

    const data = await tokenResponse.json();
    const accessToken = data.access_token;

    const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!userResponse.ok) {
        return res.status(500).send({ message: "Failed to get user" });
    }

    const userData: { id: string; username: string; avatar: string; global_name: string } = await userResponse.json();

    const websiteUser: { id: string; oauth_identifier: string }[] = await prisma.$queryRaw`
        SELECT * FROM website_user
        WHERE oauth_identifier = ${userData.id}
    `;

    let websiteUserId: string;

    if (websiteUser.length === 0) {
        const newWebsiteUser: { id: string }[] = await prisma.$queryRaw`
            INSERT INTO website_user (id, oauth_identifier, oauth_username, oauth_avatar, oauth_global_name, oauth_provider)
            VALUES (gen_random_uuid(), ${userData.id}, ${userData.username}, ${userData.avatar}, ${userData.global_name}, 'discord')
            RETURNING id
        `;

        websiteUserId = newWebsiteUser[0].id;
    } else {
        websiteUserId = websiteUser[0].id;

        await prisma.$executeRaw`
            UPDATE website_user
            SET oauth_username = ${userData.username}, oauth_avatar = ${userData.avatar}, oauth_global_name = ${userData.global_name}
            WHERE id = ${websiteUserId}::UUID
        `;
    }

    const sessionToken = generateSessionToken(50);

    await prisma.$executeRaw`
        INSERT INTO "website_session" (id, session_token, website_user_id)
        VALUES (gen_random_uuid(), ${sessionToken}, ${websiteUserId}::UUID)
    `;

    const playerLinkedToWebsiteUserQuery: { player_id: string; website_user_id: string }[] = await prisma.$queryRaw`
        SELECT * FROM "website_user_to_player"
        WHERE website_user_id = ${websiteUserId}::UUID
    `;

    if (playerLinkedToWebsiteUserQuery.length === 0) {
        const playerLinkTokenQuery: { token: string; website_user_id: string }[] = await prisma.$queryRaw`
            SELECT * FROM "website_user_to_player_token"
            WHERE website_user_id = ${websiteUserId}::UUID
        `;

        if (playerLinkTokenQuery.length === 0) {
            const playerLinkToken = generatePlayerLinkToken(10);

            await prisma.$executeRaw`
                INSERT INTO "website_user_to_player_token" (id, token, website_user_id)
                VALUES (gen_random_uuid(), ${playerLinkToken}, ${websiteUserId}::UUID)
            `;
        }
    }

    return res.status(200).send({ message: "Discord ID fetched successfully!", cookie: sessionToken });
};
