import { randomUUIDv7 } from "bun";
import type { z } from "zod";
import Logger from "../lib/logger";
import prisma from "../prisma/client";
import type { playerSchema } from "../schemas/player.zod";

export default async function addPlayerIfNotExist(player: z.infer<typeof playerSchema>): Promise<{
    id: string;
    playerAdded: boolean;
    usernameAdded: boolean;
}> {
    let playerAdded = false;
    let usernameAdded = false;
    let playerId;

    const existingPlayers: { id: string }[] = await prisma.$queryRaw`
        SELECT id FROM player WHERE auth_id = ${player.authId}
    `;
    const existingPlayer = existingPlayers[0];

    if (existingPlayer !== undefined) {
        const usernames: { id: string }[] = await prisma.$queryRaw`SELECT id FROM player_username WHERE username = ${player.nickname}`;
        if (usernames[0] === undefined) {
            Logger.log({ message: `Inserting username ${player.nickname} to DB`, path: "addPlayerIfNotExist.ts" });
            await prisma.$executeRaw`
                INSERT INTO player_username (id, player_id, username)
                VALUES (gen_random_uuid(), ${existingPlayer.id}::UUID, ${player.nickname})
            `;
            usernameAdded = true;
        }
        playerId = existingPlayer.id;
    } else {
        Logger.log({ message: `Inserting a new player:  ${player.authNickname}, ${player.authProvider}, ${player.authId}`, path: "addPlayerIfNotExist.ts" });
        const newId = randomUUIDv7();
        await prisma.$executeRaw`  
            INSERT INTO player (id, auth_nickname, auth_provider, auth_id)
            VALUES (${newId}::UUID, ${player.authNickname}, ${player.authProvider}, ${player.authId})
        `;
        await prisma.$executeRaw`
        INSERT INTO player_username (id, player_id, username)
            VALUES (gen_random_uuid(), ${newId}::UUID, ${player.nickname})
        `;
        playerAdded = true;
        playerId = newId;
    }
    return { id: playerId, playerAdded, usernameAdded };
}
