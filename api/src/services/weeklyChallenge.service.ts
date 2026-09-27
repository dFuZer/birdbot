import { Prisma, type WeeklyChallengePeriod } from "@prisma/client";
import addPlayerIfNotExist from "../helpers/addPlayerIfNotExist";
import { getDiscordAvatarUrl } from "../helpers/discord";
import { languageEnumToDatabaseEnumMap } from "../helpers/maps";
import {
    buildWeeklyChallengeConfig,
    startOfUtcWeek,
    WEEK_MS,
    WEEKLY_CHALLENGE_HORIZON_WEEKS,
    type RankingKey,
    type WeeklyChallengeConfig,
} from "../helpers/weeklyChallenges";
import { getLevelDataFromXp } from "../helpers/xp";
import prisma from "../prisma";
import type { TLanguage } from "../schemas/records.zod";
import type { TSubmitWeeklyChallengeResult } from "../schemas/weeklyChallenge.zod";

/** Late bot retries (write queue backoff) are still accepted for this long after a period ends. */
const SUBMISSION_GRACE_MS = 30 * 60 * 1000;

class WeeklyChallengeSubmissionError extends Error {
    constructor(
        message: string,
        public readonly statusCode: 404 | 409 | 422,
    ) {
        super(message);
    }
}

let ensuredThroughWeekStart = 0;

/**
 * Generates any missing periods up to the horizon. The first ever period starts on the deployment week,
 * and every later sequence is anchored to it, so regeneration is deterministic.
 */
async function ensureWeeklyChallengePeriods(now = new Date()): Promise<void> {
    const currentWeekStart = startOfUtcWeek(now).getTime();
    if (ensuredThroughWeekStart === currentWeekStart) return;

    const [first, last] = await Promise.all([
        prisma.weeklyChallengePeriod.findFirst({ orderBy: { sequence: "asc" }, select: { starts_at: true, sequence: true } }),
        prisma.weeklyChallengePeriod.findFirst({ orderBy: { sequence: "desc" }, select: { sequence: true } }),
    ]);
    const anchor = first ? first.starts_at.getTime() - first.sequence * WEEK_MS : currentWeekStart;
    const currentSequence = Math.floor((currentWeekStart - anchor) / WEEK_MS);
    const targetSequence = currentSequence + WEEKLY_CHALLENGE_HORIZON_WEEKS;
    const nextSequence = last ? last.sequence + 1 : 0;

    const rows: Prisma.WeeklyChallengePeriodCreateManyInput[] = [];
    for (let sequence = nextSequence; sequence <= targetSequence; sequence++) {
        const config = buildWeeklyChallengeConfig(sequence);
        const startsAt = anchor + sequence * WEEK_MS;
        rows.push({
            sequence,
            kind: config.kind,
            starts_at: new Date(startsAt),
            ends_at: new Date(startsAt + WEEK_MS),
            config_version: config.version,
            config: config as unknown as Prisma.InputJsonObject,
        });
    }
    if (rows.length > 0) {
        await prisma.weeklyChallengePeriod.createMany({ data: rows, skipDuplicates: true });
    }
    ensuredThroughWeekStart = currentWeekStart;
}

function serializePeriod(period: WeeklyChallengePeriod) {
    return {
        id: period.id,
        sequence: period.sequence,
        kind: period.kind,
        startsAt: period.starts_at.getTime(),
        endsAt: period.ends_at.getTime(),
        configVersion: period.config_version,
        config: period.config as unknown as WeeklyChallengeConfig,
    };
}

async function getCurrentWeeklyChallenge(now = new Date()) {
    await ensureWeeklyChallengePeriods(now);
    const period = await prisma.weeklyChallengePeriod.findFirst({
        where: { starts_at: { lte: now }, ends_at: { gt: now } },
    });
    if (!period) return null;
    const next = await prisma.weeklyChallengePeriod.findUnique({ where: { sequence: period.sequence + 1 } });
    return { current: serializePeriod(period), next: next ? serializePeriod(next) : null };
}

async function listWeeklyChallengePeriods(page: number, perPage: number, now = new Date()) {
    await ensureWeeklyChallengePeriods(now);
    const where = { starts_at: { lte: now } };
    const [periods, total] = await Promise.all([
        prisma.weeklyChallengePeriod.findMany({
            where,
            orderBy: { starts_at: "desc" },
            skip: (page - 1) * perPage,
            take: perPage,
        }),
        prisma.weeklyChallengePeriod.count({ where }),
    ]);
    return { periods: periods.map(serializePeriod), total, page, perPage };
}

const sqlOrder = (key: RankingKey) => Prisma.raw(key.order === "asc" ? "ASC" : "DESC");
const sqlBetter = (key: RankingKey) => Prisma.raw(key.order === "asc" ? "<" : ">");

function orderBySql(ranking: WeeklyChallengeConfig["ranking"]) {
    return ranking.secondary
        ? Prisma.sql`r.primary_value ${sqlOrder(ranking.primary)}, r.secondary_value ${sqlOrder(ranking.secondary)}`
        : Prisma.sql`r.primary_value ${sqlOrder(ranking.primary)}`;
}

type LeaderboardRow = {
    rank: bigint;
    player_id: string;
    auth_id: string;
    username: string | null;
    xp: number;
    discord_user_id: string | null;
    discord_avatar_hash: string | null;
    primary_value: number;
    secondary_value: number | null;
    elapsed_ms: number;
    words_count: number;
    game_id: string;
    achieved_at: Date;
};

async function getWeeklyChallengeLeaderboard(periodId: string, language: TLanguage, page: number, perPage: number) {
    const period = await prisma.weeklyChallengePeriod.findUnique({ where: { id: periodId } });
    if (!period) return null;
    const config = period.config as unknown as WeeklyChallengeConfig;
    const dbLanguage = languageEnumToDatabaseEnumMap[language];
    const orderBy = orderBySql(config.ranking);

    const [rows, total] = await Promise.all([
        prisma.$queryRaw<LeaderboardRow[]>`
            SELECT DENSE_RANK() OVER (ORDER BY ${orderBy}) AS rank,
                   r.player_id, p.auth_id, p.metadata->>'latest_username' AS username, p.xp,
                   wu.oauth_identifier AS discord_user_id, wu.oauth_avatar AS discord_avatar_hash,
                   r.primary_value, r.secondary_value, r.elapsed_ms, r.words_count, r.game_id, r.achieved_at
            FROM weekly_challenge_best_result r
            JOIN player p ON p.id = r.player_id
            LEFT JOIN website_user_to_player wup ON wup.player_id = p.id
            LEFT JOIN website_user wu ON wu.id = wup.website_user_id
            WHERE r.period_id = ${periodId}::UUID AND r.language = ${dbLanguage}::"language"
            ORDER BY ${orderBy}, p.auth_id
            LIMIT ${perPage} OFFSET ${(page - 1) * perPage}
        `,
        prisma.weeklyChallengeBestResult.count({ where: { period_id: periodId, language: dbLanguage } }),
    ]);

    return {
        period: serializePeriod(period),
        language,
        total,
        page,
        perPage,
        entries: rows.map((row) => ({
            rank: Number(row.rank),
            playerId: row.player_id,
            authId: row.auth_id,
            username: row.username,
            xp: getLevelDataFromXp(row.xp),
            avatarUrl: getDiscordAvatarUrl(row.discord_user_id, row.discord_avatar_hash),
            primaryValue: row.primary_value,
            secondaryValue: row.secondary_value,
            elapsedMs: row.elapsed_ms,
            wordsCount: row.words_count,
            gameId: row.game_id,
            achievedAt: row.achieved_at.getTime(),
        })),
    };
}

/** Shared (dense) rank: 1 + number of distinct strictly better scores. */
async function getSharedRank(
    periodId: string,
    dbLanguage: string,
    ranking: WeeklyChallengeConfig["ranking"],
    primary: number,
    secondary: number | null,
): Promise<number> {
    const better =
        ranking.secondary && secondary !== null
            ? Prisma.sql`(primary_value ${sqlBetter(ranking.primary)} ${primary}
                OR (primary_value = ${primary} AND secondary_value ${sqlBetter(ranking.secondary)} ${secondary}))`
            : Prisma.sql`primary_value ${sqlBetter(ranking.primary)} ${primary}`;
    const [row] = await prisma.$queryRaw<{ better: bigint }[]>`
        SELECT COUNT(DISTINCT (primary_value, COALESCE(secondary_value, 0))) AS better
        FROM weekly_challenge_best_result
        WHERE period_id = ${periodId}::UUID AND language = ${dbLanguage}::"language" AND ${better}
    `;
    return Number(row?.better ?? 0) + 1;
}

async function submitWeeklyChallengeResult(input: TSubmitWeeklyChallengeResult, now = new Date()) {
    const period = await prisma.weeklyChallengePeriod.findUnique({ where: { id: input.periodId } });
    if (!period) throw new WeeklyChallengeSubmissionError("Unknown weekly challenge period", 404);

    const achievedAt = new Date(input.achievedAt);
    if (achievedAt < period.starts_at || achievedAt >= period.ends_at) {
        throw new WeeklyChallengeSubmissionError("Result was not achieved during this period", 409);
    }
    if (now.getTime() > period.ends_at.getTime() + SUBMISSION_GRACE_MS) {
        throw new WeeklyChallengeSubmissionError("Weekly challenge period is closed", 409);
    }
    if (input.configVersion !== period.config_version) {
        throw new WeeklyChallengeSubmissionError("Config version mismatch", 409);
    }

    const config = period.config as unknown as WeeklyChallengeConfig;
    const languageConfig = config.languages[input.language];
    if (!languageConfig || languageConfig.fingerprint !== input.rulesFingerprint) {
        throw new WeeklyChallengeSubmissionError("Room rules do not match this challenge", 422);
    }
    const secondary = config.ranking.secondary ? input.secondaryValue : null;
    if (config.ranking.secondary && secondary === null) {
        throw new WeeklyChallengeSubmissionError("A secondary metric is required for this challenge", 422);
    }

    const player = await addPlayerIfNotExist(input.player);
    const dbLanguage = languageEnumToDatabaseEnumMap[input.language];
    const primaryBetter = sqlBetter(config.ranking.primary);
    const improvement = config.ranking.secondary
        ? Prisma.sql`EXCLUDED.primary_value ${primaryBetter} existing.primary_value
            OR (EXCLUDED.primary_value = existing.primary_value
                AND EXCLUDED.secondary_value ${sqlBetter(config.ranking.secondary)} existing.secondary_value)`
        : Prisma.sql`EXCLUDED.primary_value ${primaryBetter} existing.primary_value`;

    const written = await prisma.$queryRaw<{ player_id: string }[]>`
        INSERT INTO weekly_challenge_best_result AS existing
            (period_id, language, player_id, primary_value, secondary_value, elapsed_ms, words_count, game_id, achieved_at, updated_at)
        VALUES (${period.id}::UUID, ${dbLanguage}::"language", ${player.id}::UUID, ${input.primaryValue}, ${secondary},
                ${input.elapsedMs}, ${input.wordsCount}, ${input.gameId}::UUID, ${achievedAt}, NOW())
        ON CONFLICT (period_id, language, player_id) DO UPDATE SET
            primary_value = EXCLUDED.primary_value,
            secondary_value = EXCLUDED.secondary_value,
            elapsed_ms = EXCLUDED.elapsed_ms,
            words_count = EXCLUDED.words_count,
            game_id = EXCLUDED.game_id,
            achieved_at = EXCLUDED.achieved_at,
            updated_at = NOW()
        WHERE ${improvement}
        RETURNING player_id
    `;

    const best = await prisma.weeklyChallengeBestResult.findUniqueOrThrow({
        where: { period_id_language_player_id: { period_id: period.id, language: dbLanguage, player_id: player.id } },
    });
    // A retried submission of the already stored result still reports the personal best it created.
    const isSameStoredResult =
        best.game_id === input.gameId &&
        best.primary_value === input.primaryValue &&
        best.secondary_value === secondary &&
        best.achieved_at.getTime() === achievedAt.getTime();
    const improved = written.length > 0 || isSameStoredResult;

    const [rank, totalPlayers] = await Promise.all([
        getSharedRank(period.id, dbLanguage, config.ranking, best.primary_value, best.secondary_value),
        prisma.weeklyChallengeBestResult.count({ where: { period_id: period.id, language: dbLanguage } }),
    ]);

    return {
        improved,
        rank,
        totalPlayers,
        best: {
            primaryValue: best.primary_value,
            secondaryValue: best.secondary_value,
            elapsedMs: best.elapsed_ms,
            wordsCount: best.words_count,
            achievedAt: best.achieved_at.getTime(),
        },
    };
}

export {
    ensureWeeklyChallengePeriods,
    getCurrentWeeklyChallenge,
    getWeeklyChallengeLeaderboard,
    listWeeklyChallengePeriods,
    submitWeeklyChallengeResult,
    WeeklyChallengeSubmissionError,
};
