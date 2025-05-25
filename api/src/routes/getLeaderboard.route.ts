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
            avatar_url: string;
            username: string;
            account_name: string;
            xp: number;
        }[] = await prisma.$queryRaw`
            SELECT
                ppl.player_id,
                ppl.pp_sum,
                p.account_name,
                p.metadata->>'latest_username' as username,
                p.metadata->>'avatar_url' as avatar_url,
                ppl.language,
                p.xp,
                CAST(ROW_NUMBER() OVER (
                ORDER BY ppl.pp_sum DESC) AS int) AS "rank"
            FROM
                pp_leaderboard ppl
            INNER JOIN player p
            ON
                p.id = ppl.player_id
            ORDER BY
                "rank" ASC
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
                accountName: row.account_name,
                avatarUrl: row.avatar_url,
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
            account_name: string;
            avatar_url: string;
        }[] = await prisma.$queryRaw`
            SELECT
                p.id AS player_id,
                p.xp,
                p.account_name,
                p.metadata->>'latest_username' as username,
                p.metadata->>'avatar_url' as avatar_url,
                CAST(ROW_NUMBER() OVER (
                ORDER BY p.xp DESC) AS int) AS "rank"
            FROM
                player p
            ORDER BY
                "rank" ASC
            LIMIT
                ${perPage}
            OFFSET
                ${(page - 1) * perPage};
        `;

        const totalCount: { count: number }[] = await prisma.$queryRaw`
            SELECT CAST(COUNT(*) as int) as count
            FROM player p
        `;

        const maxPage = Math.ceil(totalCount[0].count / perPage);

        return res.status(200).send({
            mode: "xp",
            maxPage,
            data: leaderboard.map((row) => ({
                id: row.player_id,
                xp: getLevelDataFromXp(row.xp),
                rank: row.rank,
                accountName: row.account_name,
                name: row.username,
                avatarUrl: row.avatar_url,
            })),
        });
    } else if (mode === "records") {
        const leaderboard: {
            player_id: string;
            records_count: number;
            xp: number;
            account_name: string;
            username: string;
            avatar_url: string;
            rank: number;
        }[] = await prisma.$queryRaw`
            WITH ct AS (
            SELECT
                DISTINCT ON
                (player_id,
                records_count)
            l.player_id,
                p.xp,
                p.account_name,
                p.metadata->>'latest_username' as username,
                p.metadata->>'avatar_url' as avatar_url,
                CAST(count(*) OVER (PARTITION BY l.player_id) AS int) AS records_count
            FROM
                leaderboard l
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
                "rank" ASC
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
                accountName: row.account_name,
                name: row.username,
                rank: row.rank,
                avatarUrl: row.avatar_url,
            })),
        });
    }

    return res.status(400).send({ message: "Invalid mode" });
};
