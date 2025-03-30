import { type RouteHandlerMethod } from "fastify";
import addGameIfNotExist from "../helpers/addGameIfNotExist";
import addPlayerIfNotExist from "../helpers/addPlayerIfNotExist";
import Logger from "../lib/logger";
import prisma from "../prisma";
import { gameRecap } from "../schemas/game.zod";

export let addGameRecapRouteHandler: RouteHandlerMethod = async function (req, res) {
    Logger.log({ message: "-- addGameRecap route handler --", path: "addGameRecap.route.ts" });
    let requestJson = req.body;
    let parsed = gameRecap.safeParse(requestJson);
    if (!parsed.success) {
        Logger.error({ message: "Input rejected by Zod", path: "addGameRecap.route.ts", errorType: "zod", error: parsed.error });
        return res.status(400).send({ message: "Invalid input!" });
    }
    Logger.log({ message: `Trying to add game recap`, path: "addGameRecap.route.ts", json: { parsed: parsed.data } });
    try {
        const gameRecapData = parsed.data;
        const [game, player] = await Promise.all([addGameIfNotExist(gameRecapData.game), addPlayerIfNotExist(gameRecapData.player)]);
        Logger.log({ message: `Inserting game recap`, path: "addGameRecap.route.ts" });
        await prisma.$executeRaw`
            INSERT INTO game_recap (id,
            game_id,
            player_id,
            died_at,
            words_count,
            flips_count,
            depleted_syllables_count,
            alpha_count,
            words_without_death_count,
            previous_syllables_count,
            multi_syllables_count,
            hyphen_words_count,
            more_than_20_letters_words_count)
            VALUES (gen_random_uuid(),
            ${game.id}::UUID,
            ${player.id}::UUID,
            ${new Date(gameRecapData.diedAt)},
            ${gameRecapData.wordsCount},
            ${gameRecapData.flipsCount},
            ${gameRecapData.depletedSyllablesCount},
            ${gameRecapData.alphaCount},
            ${gameRecapData.wordsWithoutDeathCount},
            ${gameRecapData.previousSyllablesCount},
            ${gameRecapData.multiSyllablesCount},
            ${gameRecapData.hyphenWordsCount},
            ${gameRecapData.moreThan20LettersWordsCount})
        `;
        return res.status(200).send({ message: "Game recap added successfully" });
    } catch (e) {
        Logger.error({ message: "Failed to add game recap", path: "addGameRecap.route.ts", errorType: "unknown", error: e });
        return res.status(500).send({ message: "Failed to add game recap" });
    }
};
