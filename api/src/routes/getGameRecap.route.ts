import type { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { authenticatedPlayerSql } from "../helpers/authenticatedPlayer";
import { GameRecapListRow, gameRecapSelectSql, mapGameRecapRow } from "../helpers/mapGameRecap";
import Logger from "../lib/logger";
import prisma from "../prisma";

const LOG_PATH = "getGameRecap.route.ts";

export const getGameRecapRouteHandler: RouteHandlerMethod = async function (req, res) {
    const parsed = z.object({ recapId: z.string().uuid() }).safeParse(req.params);
    if (!parsed.success) {
        return res.status(400).send({ message: "Invalid recap id" });
    }

    const { recapId } = parsed.data;

    try {
        const rows: GameRecapListRow[] = await prisma.$queryRaw`
            SELECT ${gameRecapSelectSql}
            FROM game_recap gr
            INNER JOIN game g ON g.id = gr.game_id
            INNER JOIN player p ON p.id = gr.player_id
            WHERE gr.id = ${recapId}::uuid
            AND ${authenticatedPlayerSql}
            LIMIT 1
        `;

        const recap = rows[0];
        if (!recap) {
            return res.status(404).send({ message: "Game recap not found" });
        }

        const siblings: { id: string; auth_id: string; username: string | null; words_count: number }[] =
            await prisma.$queryRaw`
            SELECT
                gr.id,
                p.auth_id,
                p.metadata->>'latest_username' AS username,
                gr.words_count
            FROM game_recap gr
            INNER JOIN player p ON p.id = gr.player_id
            WHERE gr.game_id = ${recap.game_id}::uuid
            AND ${authenticatedPlayerSql}
            ORDER BY gr.words_count DESC, gr.id ASC
        `;

        const wordCountRows: { count: number }[] = await prisma.$queryRaw`
            SELECT CAST(COUNT(*) AS int) AS count
            FROM word w
            INNER JOIN player p ON p.id = w.player_id
            WHERE w.game_id = ${recap.game_id}::uuid
            AND ${authenticatedPlayerSql}
        `;

        return res.status(200).send({
            recap: mapGameRecapRow(recap),
            gameWordCount: wordCountRows[0]?.count ?? 0,
            playersInGame: siblings.map((player) => ({
                recapId: player.id,
                authId: player.auth_id,
                username: player.username ?? player.auth_id,
                wordsCount: player.words_count,
            })),
        });
    } catch (error) {
        Logger.error({
            message: "Error fetching game recap",
            path: LOG_PATH,
            errorType: "unknown",
            error,
        });
        return res.status(500).send({ message: "Internal server error!" });
    }
};
