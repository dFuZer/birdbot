import { Prisma } from "@prisma/client";
import type { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { authenticatedPlayerSql } from "../helpers/authenticatedPlayer";
import { decodeCursor, encodeCursor } from "../helpers/cursors";
import { mapWordRow, WordRow } from "../helpers/mapWord";
import Logger from "../lib/logger";
import prisma from "../prisma";
import { numericString } from "../schemas/common.zod";

const LOG_PATH = "getGameWords.route.ts";

const wordSelectSql = Prisma.raw(`
    w.id,
    w.created_at,
    w.word,
    w.prompt,
    w.flip,
    w.submit_result,
    w.duration_ms,
    w.reaction_ms,
    w.player_id,
    p.auth_id,
    p.metadata->>'latest_username' AS username
`);

export const getGameWordsRouteHandler: RouteHandlerMethod = async function (req, res) {
    const parsedParams = z.object({ gameId: z.string().uuid() }).safeParse(req.params);
    const parsedQuery = z
        .object({
            cursor: z.string().optional(),
            limit: numericString.optional(),
            playerId: z.string().uuid().optional(),
            successOnly: z.enum(["1", "true"]).optional(),
        })
        .safeParse(req.query);

    if (!parsedParams.success || !parsedQuery.success) {
        return res.status(400).send({ message: "Invalid input" });
    }

    const { gameId } = parsedParams.data;
    const { playerId } = parsedQuery.data;
    const successOnly = Boolean(parsedQuery.data.successOnly);
    const limit = Math.min(Math.max(parsedQuery.data.limit ?? 100, 1), 200);
    const cursor = decodeCursor(parsedQuery.data.cursor);
    const cursorCreatedAt = cursor?.createdAt;
    const cursorId = cursor?.id;

    if (parsedQuery.data.cursor && (!cursorCreatedAt || !cursorId)) {
        return res.status(400).send({ message: "Invalid cursor" });
    }

    const playerClause = playerId ? Prisma.sql`AND w.player_id = ${playerId}::uuid` : Prisma.empty;
    const successClause = successOnly ? Prisma.sql`AND w.submit_result = 'SUCCESS'` : Prisma.empty;
    const cursorClause =
        cursorCreatedAt && cursorId
            ? Prisma.sql`AND (w.created_at, w.id) > (${new Date(cursorCreatedAt)}::timestamptz, ${cursorId}::uuid)`
            : Prisma.empty;

    try {
        const [rows, countRows] = await Promise.all([
            prisma.$queryRaw<WordRow[]>`
                SELECT ${wordSelectSql}
                FROM word w
                INNER JOIN player p ON p.id = w.player_id
                WHERE w.game_id = ${gameId}::uuid
                AND ${authenticatedPlayerSql}
                ${playerClause}
                ${successClause}
                ${cursorClause}
                ORDER BY w.created_at ASC, w.id ASC
                LIMIT ${limit + 1}
            `,
            prisma.$queryRaw<{ count: number }[]>`
                SELECT CAST(COUNT(*) AS int) AS count
                FROM word w
                INNER JOIN player p ON p.id = w.player_id
                WHERE w.game_id = ${gameId}::uuid
                AND ${authenticatedPlayerSql}
                ${playerClause}
                ${successClause}
            `,
        ]);

        const hasMore = rows.length > limit;
        const page = hasMore ? rows.slice(0, limit) : rows;
        const last = page[page.length - 1];

        return res.status(200).send({
            rows: page.map(mapWordRow),
            totalCount: Number(countRows[0]?.count ?? 0),
            nextCursor: hasMore && last ? encodeCursor({ createdAt: last.created_at.toISOString(), id: last.id }) : null,
        });
    } catch (error) {
        Logger.error({
            message: "Error fetching game words",
            path: LOG_PATH,
            errorType: "unknown",
            error,
        });
        return res.status(500).send({ message: "Internal server error!" });
    }
};
