import { type RouteHandlerMethod } from "fastify";
import addGameIfNotExist from "../helpers/addGameIfNotExist";
import Logger from "../lib/logger";
import { gameSchema } from "../schemas/game.zod";

export let addGameRouteHandler: RouteHandlerMethod = async function (req, res) {
    Logger.log({ message: "-- addGame route handler --", path: "addGame.route.ts" });
    let requestJson = req.body;
    let parsed = gameSchema.safeParse(requestJson);
    if (!parsed.success) {
        Logger.error({
            message: "Input rejected by Zod",
            path: "addGame.route.ts",
            errorType: "zod",
            error: parsed.error,
        });
        return res.status(400).send({ message: "Invalid input!" });
    }
    Logger.log({ message: `Trying to add game`, path: "addGame.route.ts", json: { parsed: parsed.data } });
    try {
        const gameData = parsed.data;
        const game = await addGameIfNotExist(gameData);
        return res.status(200).send({ message: "Game added successfully" });
    } catch (e) {
        Logger.error({
            message: "Failed to add game",
            path: "addGame.route.ts",
            errorType: "unknown",
            error: e,
        });
        return res.status(500).send({ message: "Failed to add game" });
    }
};
