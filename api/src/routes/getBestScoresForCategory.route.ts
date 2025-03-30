import { type RouteHandlerMethod } from "fastify";
import getBestScoresForCategory from "../helpers/getBestScoresForCategory";
import Logger from "../lib/logger";
import { getRecords } from "../schemas/records.zod";

export let getBestScoresForCategoryRouteHandler: RouteHandlerMethod = async function (req, res) {
    Logger.log({ message: "-- getBestScoresForCategory route handler --", path: "getBestScoresForCategory.route.ts" });
    let queryParams = req.query;
    let parsed = getRecords.safeParse(queryParams);
    if (!parsed.success) {
        Logger.error({ message: "Input rejected by Zod", path: "getBestScoresForCategory.route.ts", errorType: "zod", error: parsed.error });
        return res.status(400).send({ message: "Invalid input!" });
    }
    Logger.log({ message: `Trying to fetch best scores for category`, path: "getBestScoresForCategory.route.ts", json: { parsed: parsed.data } });
    try {
        Logger.log({ message: "Fetching best scores for category", path: "getBestScoresForCategory.route.ts" });
        const bestScores = await getBestScoresForCategory(parsed.data);
        return res.status(200).send({ message: "Best scores fetched successfully!", bestScores });
    } catch (error) {
        Logger.error({ message: "Error fetching best scores", path: "getBestScoresForCategory.route.ts", errorType: "unknown", error });
        return res.status(500).send({ message: "Internal server error!" });
    }
};
