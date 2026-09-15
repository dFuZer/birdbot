import Logger from "../lib/logger";
import prisma from "../prisma";

const LOG_PATH = "helpers/refreshMaterializedViews.ts";
const LEADERBOARD_REFRESH_DEBOUNCE_MS = 120_000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let refreshChain: Promise<void> = Promise.resolve();
let pendingDebouncedRefresh = false;

export async function ensureLeaderboardUniqueIndexes() {
    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_player_language_mode_record_type_uidx
        ON leaderboard (player_id, language, mode, record_type)
    `);
    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS pp_leaderboard_player_language_uidx
        ON pp_leaderboard (player_id, language)
    `);
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

function shouldFallbackToBlockingRefresh(error: unknown) {
    const message = getErrorMessage(error).toLowerCase();
    return (
        message.includes("cannot run inside a transaction block") ||
        message.includes("concurrently cannot be used") ||
        message.includes("does not have a unique index")
    );
}

function isConcurrentRefreshBusy(error: unknown) {
    const message = getErrorMessage(error).toLowerCase();
    return message.includes("already being refreshed") || message.includes("cannot refresh materialized view");
}

async function refreshView(name: "leaderboard" | "pp_leaderboard") {
    try {
        await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${name}`);
    } catch (error) {
        if (shouldFallbackToBlockingRefresh(error)) {
            Logger.warn({
                message: `Falling back to non-concurrent refresh for ${name}`,
                path: LOG_PATH,
            });
            await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW ${name}`);
            return;
        }
        throw error;
    }
}

async function refreshOnce() {
    Logger.log({ message: "Refreshing materialized views", path: LOG_PATH });
    await ensureLeaderboardUniqueIndexes();
    await refreshView("leaderboard");
    await refreshView("pp_leaderboard");
}

export default function refreshMaterializedViews() {
    const next = refreshChain.then(refreshOnce, refreshOnce);
    refreshChain = next.then(
        () => undefined,
        () => undefined,
    );
    return next;
}

async function runDebouncedRefresh() {
    try {
        await refreshMaterializedViews();
    } catch (error) {
        Logger.error({
            message: "Failed to refresh materialized views",
            path: LOG_PATH,
            errorType: "unknown",
            error,
        });
        pendingDebouncedRefresh = true;
        if (isConcurrentRefreshBusy(error)) {
            Logger.warn({
                message: "Leaderboard refresh already running; will retry after debounce",
                path: LOG_PATH,
            });
        }
    }

    if (pendingDebouncedRefresh) {
        pendingDebouncedRefresh = false;
        scheduleLeaderboardRefresh();
    }
}

export function scheduleLeaderboardRefresh() {
    pendingDebouncedRefresh = true;
    if (debounceTimer !== null) {
        return;
    }

    Logger.log({
        message: `Leaderboard refresh debounced for ${LEADERBOARD_REFRESH_DEBOUNCE_MS}ms`,
        path: LOG_PATH,
    });
    debounceTimer = setTimeout(() => {
        debounceTimer = null;
        pendingDebouncedRefresh = false;
        void runDebouncedRefresh();
    }, LEADERBOARD_REFRESH_DEBOUNCE_MS);
}
