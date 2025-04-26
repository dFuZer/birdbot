import { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI } from "../env";

export let getDiscordUserIdRouteHandler: RouteHandlerMethod = async function (req, res) {
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

    const token = await fetch(`https://discord.com/api/oauth2/token`, {
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

    const data = await token.json();
    const accessToken = data.access_token;

    const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const userData = await userResponse.json();

    return res.status(200).send({ message: "Discord ID fetched successfully!", cookie: userData.id });
};
