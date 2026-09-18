import { RouteHandlerMethod } from "fastify";
import { authenticatedPlayerSql } from "../helpers/authenticatedPlayer";
import { databaseEnumToLanguageEnumMap, PrismaLanguage } from "../helpers/maps";
import Logger from "../lib/logger";
import prisma from "../prisma";

const LOG_PATH = "getOpenMonitoring.route.ts";

type PlayerWordMetricsRow = {
    auth_id: string;
    username: string | null;
    language: PrismaLanguage;
    words_placed: number;
    distinct_words: number;
    exclusive_words: number;
    variety: number;
    unicity: number;
};

export const getOpenMonitoringRouteHandler: RouteHandlerMethod = async function (_req, res) {
    Logger.log({ message: "-- getOpenMonitoring route handler --", path: LOG_PATH });

    try {
        const rows: PlayerWordMetricsRow[] = await prisma.$queryRaw`
            SELECT
                p.auth_id,
                p.metadata->>'latest_username' AS username,
                pwm.language,
                CAST(pwm.words_placed AS int) AS words_placed,
                CAST(pwm.distinct_words AS int) AS distinct_words,
                CAST(pwm.exclusive_words AS int) AS exclusive_words,
                CAST(pwm.variety AS double precision) AS variety,
                CAST(pwm.unicity AS double precision) AS unicity
            FROM player_word_metrics pwm
            INNER JOIN player p ON p.id = pwm.player_id
            WHERE ${authenticatedPlayerSql}
        `;

        return res.status(200).send({
            players: rows.map((row) => ({
                authId: row.auth_id,
                username: row.username ?? row.auth_id,
                language: databaseEnumToLanguageEnumMap[row.language],
                wordsPlaced: row.words_placed,
                distinctWords: row.distinct_words,
                exclusiveWords: row.exclusive_words,
                variety: row.variety,
                unicity: row.unicity,
            })),
        });
    } catch (error) {
        Logger.error({
            message: "Error fetching open monitoring data",
            path: LOG_PATH,
            errorType: "unknown",
            error,
        });
        return res.status(500).send({ message: "Internal server error!" });
    }
};
