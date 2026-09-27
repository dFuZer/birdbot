import type { RouteHandlerMethod } from "fastify";
import {
    submitWeeklyChallengeResultSchema,
    weeklyChallengeLeaderboardQuerySchema,
    weeklyChallengePeriodParamsSchema,
    weeklyChallengePeriodsQuerySchema,
} from "../schemas/weeklyChallenge.zod";
import {
    getCurrentWeeklyChallenge,
    getWeeklyChallengeLeaderboard,
    listWeeklyChallengePeriods,
    submitWeeklyChallengeResult,
    WeeklyChallengeSubmissionError,
} from "../services/weeklyChallenge.service";

const getCurrentWeeklyChallengeRouteHandler: RouteHandlerMethod = async (_req, res) => {
    const challenge = await getCurrentWeeklyChallenge();
    if (!challenge) return res.status(404).send({ message: "No active weekly challenge" });
    return res.send(challenge);
};

const getWeeklyChallengePeriodsRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = weeklyChallengePeriodsQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).send({ message: "Invalid query", issues: parsed.error.issues });
    return res.send(await listWeeklyChallengePeriods(parsed.data.page, parsed.data.perPage));
};

const getWeeklyChallengeLeaderboardRouteHandler: RouteHandlerMethod = async (req, res) => {
    const params = weeklyChallengePeriodParamsSchema.safeParse(req.params);
    const query = weeklyChallengeLeaderboardQuerySchema.safeParse(req.query);
    if (!params.success) return res.status(400).send({ message: "Invalid period", issues: params.error.issues });
    if (!query.success) return res.status(400).send({ message: "Invalid query", issues: query.error.issues });
    const leaderboard = await getWeeklyChallengeLeaderboard(
        params.data.periodId,
        query.data.lang,
        query.data.page,
        query.data.perPage,
    );
    if (!leaderboard) return res.status(404).send({ message: "Unknown weekly challenge period" });
    return res.send(leaderboard);
};

const submitWeeklyChallengeResultRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = submitWeeklyChallengeResultSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).send({ message: "Invalid input", issues: parsed.error.issues });
    try {
        return res.send(await submitWeeklyChallengeResult(parsed.data));
    } catch (error) {
        if (error instanceof WeeklyChallengeSubmissionError) {
            return res.status(error.statusCode).send({ message: error.message });
        }
        throw error;
    }
};

export {
    getCurrentWeeklyChallengeRouteHandler,
    getWeeklyChallengeLeaderboardRouteHandler,
    getWeeklyChallengePeriodsRouteHandler,
    submitWeeklyChallengeResultRouteHandler,
};
