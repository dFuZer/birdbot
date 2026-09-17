import { Prisma } from "@prisma/client";
import type { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { decodeCursor, encodeCursor, sanitizeSearch } from "../helpers/cursors";
import { GameRecapListRow, gameRecapSelectSql, mapGameRecapRow } from "../helpers/mapGameRecap";
import { languageEnumToDatabaseEnumMap, modeEnumToDatabaseEnumMap } from "../helpers/maps";
import Logger from "../lib/logger";
import prisma from "../prisma";
import { numericString } from "../schemas/common.zod";
import { languageEnumSchema, modeEnumSchema } from "../schemas/records.zod";

const LOG_PATH = "getGameRecaps.route.ts";

export const recapSortSchema = z.enum(["newest", "oldest", "mostWords", "fewestWords", "longest", "shortest"]);
export type RecapSort = z.infer<typeof recapSortSchema>;

function getSortParts(sort: RecapSort) {
    switch (sort) {
        case "oldest":
            return {
                order: Prisma.sql`ORDER BY gr.died_at ASC, gr.id ASC`,
                cursor: (value: string, id: string) =>
                    Prisma.sql`AND (gr.died_at, gr.id) > (${new Date(value)}::timestamptz, ${id}::uuid)`,
                cursorValue: (row: GameRecapListRow) => row.died_at.toISOString(),
            };
        case "mostWords":
            return {
                order: Prisma.sql`ORDER BY gr.words_count DESC, gr.id DESC`,
                cursor: (value: string, id: string) =>
                    Prisma.sql`AND (gr.words_count, gr.id) < (${Number(value)}::int, ${id}::uuid)`,
                cursorValue: (row: GameRecapListRow) => String(row.words_count),
            };
        case "fewestWords":
            return {
                order: Prisma.sql`ORDER BY gr.words_count ASC, gr.id ASC`,
                cursor: (value: string, id: string) =>
                    Prisma.sql`AND (gr.words_count, gr.id) > (${Number(value)}::int, ${id}::uuid)`,
                cursorValue: (row: GameRecapListRow) => String(row.words_count),
            };
        case "longest":
            return {
                order: Prisma.sql`ORDER BY EXTRACT(EPOCH FROM (gr.died_at - g.started_at)) DESC, gr.id DESC`,
                cursor: (value: string, id: string) =>
                    Prisma.sql`AND (EXTRACT(EPOCH FROM (gr.died_at - g.started_at)) * 1000, gr.id) < (${Number(value)}::float, ${id}::uuid)`,
                cursorValue: (row: GameRecapListRow) => String(Number(row.duration_ms)),
            };
        case "shortest":
            return {
                order: Prisma.sql`ORDER BY EXTRACT(EPOCH FROM (gr.died_at - g.started_at)) ASC, gr.id ASC`,
                cursor: (value: string, id: string) =>
                    Prisma.sql`AND (EXTRACT(EPOCH FROM (gr.died_at - g.started_at)) * 1000, gr.id) > (${Number(value)}::float, ${id}::uuid)`,
                cursorValue: (row: GameRecapListRow) => String(Number(row.duration_ms)),
            };
        case "newest":
        default:
            return {
                order: Prisma.sql`ORDER BY gr.died_at DESC, gr.id DESC`,
                cursor: (value: string, id: string) =>
                    Prisma.sql`AND (gr.died_at, gr.id) < (${new Date(value)}::timestamptz, ${id}::uuid)`,
                cursorValue: (row: GameRecapListRow) => row.died_at.toISOString(),
            };
    }
}

export const getGameRecapsRouteHandler: RouteHandlerMethod = async function (req, res) {
    const parsed = z
        .object({
            q: z.string().optional(),
            cursor: z.string().optional(),
            limit: numericString.optional(),
            language: languageEnumSchema.optional(),
            mode: modeEnumSchema.optional(),
            minWords: numericString.optional(),
            sort: recapSortSchema.optional(),
        })
        .safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).send({ message: "Invalid query" });
    }

    const search = sanitizeSearch(parsed.data.q ?? "");
    const limit = Math.min(Math.max(parsed.data.limit ?? 30, 1), 100);
    const sort = parsed.data.sort ?? "newest";
    const minWords = parsed.data.minWords ?? 0;
    const cursor = decodeCursor(parsed.data.cursor);
    const cursorValue = cursor?.v;
    const cursorId = cursor?.id;

    if (parsed.data.cursor && (!cursorValue || !cursorId)) {
        return res.status(400).send({ message: "Invalid cursor" });
    }

    const searchClause = search
        ? Prisma.sql`AND (
                p.account_name ILIKE ${`%${search}%`}
                OR COALESCE(p.metadata->>'latest_username', '') ILIKE ${`%${search}%`}
            )`
        : Prisma.empty;

    const languageClause = parsed.data.language
        ? Prisma.sql`AND g.language = ${languageEnumToDatabaseEnumMap[parsed.data.language]}::"language"`
        : Prisma.empty;

    const modeClause = parsed.data.mode
        ? Prisma.sql`AND g.mode = ${modeEnumToDatabaseEnumMap[parsed.data.mode]}::"game_mode"`
        : Prisma.empty;

    const minWordsClause = minWords > 0 ? Prisma.sql`AND gr.words_count >= ${minWords}` : Prisma.empty;

    const sortParts = getSortParts(sort);
    const cursorClause =
        cursorValue && cursorId ? sortParts.cursor(cursorValue, cursorId) : Prisma.empty;

    try {
        const rows: GameRecapListRow[] = await prisma.$queryRaw`
            SELECT ${gameRecapSelectSql}
            FROM game_recap gr
            INNER JOIN game g ON g.id = gr.game_id
            INNER JOIN player p ON p.id = gr.player_id
            WHERE TRUE
            ${searchClause}
            ${languageClause}
            ${modeClause}
            ${minWordsClause}
            ${cursorClause}
            ${sortParts.order}
            LIMIT ${limit + 1}
        `;

        const hasMore = rows.length > limit;
        const pageRows = hasMore ? rows.slice(0, limit) : rows;
        const last = pageRows[pageRows.length - 1];

        return res.status(200).send({
            recaps: pageRows.map(mapGameRecapRow),
            nextCursor: hasMore && last ? encodeCursor({ v: sortParts.cursorValue(last), id: last.id }) : null,
        });
    } catch (error) {
        Logger.error({
            message: "Error fetching game recaps",
            path: LOG_PATH,
            errorType: "unknown",
            error,
        });
        return res.status(500).send({ message: "Internal server error!" });
    }
};
