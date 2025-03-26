import type { RouteHandlerMethod } from "fastify";
import addPlayerIfNotExist from "../helpers/addPlayerIfNotExist";
import Logger from "../lib/logger";
import { addPlayersSchema } from "../schemas/player.zod";

export let addPlayersRouteHandler: RouteHandlerMethod = async function (req, res) {
    Logger.log({ message: "-- addPlayers route handler --", path: "addPlayers.route.ts" });
    let requestJson = req.body;
    let parsed = addPlayersSchema.safeParse(requestJson);

    if (!parsed.success) {
        parsed.error;
        Logger.error({
            message: "Input rejected by Zod",
            path: "addPlayer.route.ts",
            errorType: "zod",
            error: parsed.error,
        });
        return res.status(400).send({ message: "Invalid input!" });
    }

    try {
        const players = parsed.data;
        let addedPlayersCount = 0;
        let addedUsernamesCount = 0;
        for (const player of players) {
            const existingPlayer = await addPlayerIfNotExist(player);
            if (existingPlayer.playerAdded) addedPlayersCount++;
            else if (existingPlayer.usernameAdded) addedUsernamesCount++;
        }
        Logger.log({ message: `Players added successfully: ${addedPlayersCount} players, ${addedUsernamesCount} usernames`, path: "addPlayer.route.ts" });
        return res.status(200).send({ message: "Players added successfully" });
    } catch (e) {
        Logger.error({ message: `Failed to add players`, path: "addPlayer.route.ts", errorType: "unknown", error: e });
        return res.status(500).send({ message: "Failed to add players" });
    }
};
