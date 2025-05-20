import { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { databaseEnumToLanguageEnumMap, PrismaLanguage } from "../helpers/maps";
import { getLevelDataFromXp } from "../helpers/xp";
import Logger from "../lib/logger";
import prisma from "../prisma";
import { numericString } from "../schemas/common.zod";

export let getLeaderboardRouteHandler: RouteHandlerMethod = async function (req, res) {
    const query = req.query;

    const parsedQuery = z
        .object({
            mode: z.enum(["xp", "pp", "records"]),
            page: numericString.optional(),
            perPage: numericString.optional(),
        })
        .safeParse(query);

    if (!parsedQuery.success) {
        Logger.error({ message: "Invalid query", path: "getLeaderboard.route.ts", errorType: "zod", error: parsedQuery.error });
        return res.status(400).send({ message: "Invalid query" });
    }

    const { mode, page = 1, perPage = 10 } = parsedQuery.data;

    if (mode === "pp") {
        const leaderboard: {
            player_id: string;
            pp_sum: number;
            rank: number;
            language: PrismaLanguage;
            username: string;
            xp: number;
        }[] = await prisma.$queryRaw`
            SELECT
                ppl.player_id,
                ppl.pp_sum,
                plu.username,
                ppl.language,
                p.xp,
                CAST(ROW_NUMBER() OVER (
                ORDER BY ppl.pp_sum DESC) AS int) AS "rank"
            FROM
                pp_leaderboard ppl
            INNER JOIN player p
            ON
                p.id = ppl.player_id
            INNER JOIN player_latest_username plu
            ON
                p.id = plu.player_id
            ORDER BY
                pp_sum DESC
            LIMIT
                ${perPage}
            OFFSET
                ${(page - 1) * perPage};
        `;

        const totalCount: { count: number }[] = await prisma.$queryRaw`
            SELECT CAST(COUNT(*) as int) as count
            FROM pp_leaderboard ppl
            INNER JOIN player p
            ON p.id = ppl.player_id
            INNER JOIN player_latest_username plu
            ON p.id = plu.player_id
        `;

        const maxPage = Math.ceil(totalCount[0].count / perPage);

        return res.status(200).send({
            mode: "pp",
            maxPage,
            data: leaderboard.map((row) => ({
                id: row.player_id,
                pp: row.pp_sum,
                rank: row.rank,
                name: row.username,
                xp: getLevelDataFromXp(row.xp),
                language: databaseEnumToLanguageEnumMap[row.language],
            })),
        });
    } else if (mode === "xp") {
        const leaderboard: {
            player_id: string;
            xp: number;
            rank: number;
            username: string;
        }[] = await prisma.$queryRaw`
            SELECT
                p.id AS player_id,
                p.xp,
                plu.username,
                CAST(ROW_NUMBER() OVER (
                ORDER BY p.xp DESC) AS int) AS RANK
            FROM
                player p
            INNER JOIN player_latest_username plu
            ON
                p.id = plu.player_id
            ORDER BY
                p.xp DESC
            LIMIT
                ${perPage}
            OFFSET
                ${(page - 1) * perPage};
        `;

        const totalCount: { count: number }[] = await prisma.$queryRaw`
            SELECT CAST(COUNT(*) as int) as count
            FROM player p
            INNER JOIN player_latest_username plu
            ON p.id = plu.player_id
        `;

        const maxPage = Math.ceil(totalCount[0].count / perPage);

        return res.status(200).send({
            mode: "xp",
            maxPage,
            data: leaderboard.map((row) => ({
                id: row.player_id,
                xp: getLevelDataFromXp(row.xp),
                rank: row.rank,
                name: row.username,
            })),
        });
    } else if (mode === "records") {
        const leaderboard: {
            player_id: string;
            records_count: number;
            xp: number;
            username: string;
            rank: number;
        }[] = await prisma.$queryRaw`
            WITH ct AS (
            SELECT
                DISTINCT ON
                (player_id,
                records_count)
            l.player_id,
                p.xp,
                plu.username,
                CAST(count(*) OVER (PARTITION BY l.player_id) AS int) AS records_count
            FROM
                leaderboard l
            INNER JOIN player_latest_username plu 
            ON
                plu.player_id = l.player_id
            INNER JOIN player p
            ON
                l.player_id = p.id
            WHERE
                "rank" = 1)
            SELECT
                *,
                CAST(ROW_NUMBER() OVER (
                ORDER BY ct.records_count DESC) AS int) AS "rank"
            FROM
                ct
            ORDER BY
                ct.records_count DESC
            LIMIT
                ${perPage}
            OFFSET
                ${(page - 1) * perPage};
        `;

        return res.status(200).send({
            mode: "records",
            maxPage: 10,
            data: leaderboard.map((row) => ({
                id: row.player_id,
                recordsCount: row.records_count,
                xp: getLevelDataFromXp(row.xp),
                name: row.username,
                rank: row.rank,
            })),
        });
    }

    return res.status(400).send({ message: "Invalid mode" });
};
