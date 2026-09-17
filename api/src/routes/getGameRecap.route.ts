import type { RouteHandlerMethod } from "fastify";
import { z } from "zod";
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
            LIMIT 1
        `;

        const recap = rows[0];
        if (!recap) {
            return res.status(404).send({ message: "Game recap not found" });
        }

        const siblings: { id: string; account_name: string; username: string | null; words_count: number }[] =
            await prisma.$queryRaw`
            SELECT
                gr.id,
                p.account_name,
                p.metadata->>'latest_username' AS username,
                gr.words_count
            FROM game_recap gr
            INNER JOIN player p ON p.id = gr.player_id
            WHERE gr.game_id = ${recap.game_id}::uuid
            ORDER BY gr.words_count DESC, gr.id ASC
        `;

        const wordCountRows: { count: number }[] = await prisma.$queryRaw`
            SELECT CAST(COUNT(*) AS int) AS count
            FROM word
            WHERE game_id = ${recap.game_id}::uuid
        `;

        return res.status(200).send({
            recap: mapGameRecapRow(recap),
            gameWordCount: wordCountRows[0]?.count ?? 0,
            playersInGame: siblings.map((player) => ({
                recapId: player.id,
                accountName: player.account_name,
                username: player.username ?? player.account_name,
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
