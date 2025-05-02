import { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { languageEnumToDatabaseEnumMap, modeEnumToDatabaseEnumMap } from "../helpers/maps";
import prisma from "../prisma";
import { languageEnumSchema, modesEnumSchema } from "../schemas/records.zod";

export let getPlayerRecordsRouteHandler: RouteHandlerMethod = async function (req, res) {
    const query = req.query;

    const parsedData = z
        .object({
            playerId: z.string().uuid(),
            language: languageEnumSchema,
            mode: modesEnumSchema,
        })
        .safeParse(query);

    if (!parsedData.success) {
        return res.status(400).send({ message: "Invalid body" });
    }

    const { playerId, language, mode } = parsedData.data;

    const playerQuery: { id: string; account_name: string }[] =
        await prisma.$queryRaw`SELECT id, account_name FROM player where id = ${playerId}::UUID LIMIT 1`;
    const player = playerQuery[0];

    if (!player) {
        return res.status(404).send({ message: "Player not found" });
    }

    const records = await prisma.$queryRaw`SELECT record_type, score, rank
        from leaderboard
        where player_id = ${player.id}::UUID and
        language = ${languageEnumToDatabaseEnumMap[language]}::"language" and
        mode = ${modeEnumToDatabaseEnumMap[mode]}::"game_mode"`;

    return res.status(200).send(records);
};
