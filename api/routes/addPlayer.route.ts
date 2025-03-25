import type { RouteHandlerMethod } from "fastify";
import Logger from "../lib/logger";
import prisma from "../prisma/client";
import { addPlayersSchema } from "../schemas/player.zod";

export let addPlayerRouteHandler: RouteHandlerMethod = async function (req, res) {
    let requestJson = req.body;
    let parsed = addPlayersSchema.safeParse(requestJson);

    if (!parsed.success) {
        parsed.error;
        Logger.error({
            message: "Input rejected by Zod",
            path: "addPlayer.route.ts",
            errorType: "zod",
            error: parsed.error,
        });
        return res.status(400).send({ message: "Invalid input!" });
    }

    try {
        const players = parsed.data;
        let addedPlayersCount = 0;
        let addedUsernamesCount = 0;
        await prisma.$transaction(async (tx) => {
            for (const player of players) {
                const existingPlayers: { id: string }[] = await tx.$queryRaw`
                    SELECT id FROM player WHERE auth_id = ${player.authId}
                `;
                const existingPlayer = existingPlayers[0];

                if (existingPlayer !== undefined) {
                    const usernames: { id: string }[] = await tx.$queryRaw`SELECT id FROM player_username WHERE username = ${player.nickname}`;
                    if (usernames[0] === undefined) {
                        Logger.log({ message: `Inserting username ${player.nickname} to DB`, path: "addPlayer.route.ts" });
                        await tx.$executeRaw`
                            INSERT INTO player_username (id, player_id, username)
                            VALUES (gen_random_uuid(), ${existingPlayer.id}::UUID, ${player.nickname})
                        `;
                        addedUsernamesCount++;
                    }
                } else {
                    Logger.log({ message: `Inserting a new player:  ${player.authNickname}, ${player.authProvider}, ${player.authId}`, path: "addPlayer.route.ts" });
                    await tx.$executeRaw`  
                        INSERT INTO player (id, auth_nickname, auth_provider, auth_id)
                        VALUES (gen_random_uuid(), ${player.authNickname}, ${player.authProvider}, ${player.authId})
                    `;
                    addedPlayersCount++;
                }
            }
        });
        Logger.log({ message: `Players added successfully: ${addedPlayersCount} players, ${addedUsernamesCount} usernames`, path: "addPlayer.route.ts" });
        return res.status(200).send({ message: "Players added successfully" });
    } catch (e) {
        Logger.error({ message: `Failed to add players`, path: "addPlayer.route.ts", errorType: "unknown", error: e });
        return res.status(500).send({ message: "Failed to add players" });
    }
};
