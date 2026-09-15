import { type RouteHandlerMethod } from "fastify";
import { Prisma } from "@prisma/client";
import addGameIfNotExist from "../helpers/addGameIfNotExist";
import addPlayerIfNotExist from "../helpers/addPlayerIfNotExist";
import { calculateCreditsFromGameRecap } from "../helpers/credits";
import hasLeaderboardPersonalBest from "../helpers/hasLeaderboardPersonalBest";
import { languageEnumToDatabaseEnumMap, modeEnumToDatabaseEnumMap } from "../helpers/maps";
import { scheduleLeaderboardRefresh } from "../helpers/refreshMaterializedViews";
import { calculateXpFromGameRecap, ExperienceData, getLevelDataFromXp } from "../helpers/xp";
import Logger from "../lib/logger";
import prisma from "../prisma";
import { gameRecap } from "../schemas/game.zod";
import { mutateCredits, mutateXp } from "../services/parity.service";

export let addGameRecapRouteHandler: RouteHandlerMethod = async function (req, res) {
    Logger.log({
        message: "-- addGameRecap route handler --",
        path: "addGameRecap.route.ts",
    });
    let requestJson = req.body;
    let parsed = gameRecap.safeParse(requestJson);
    if (!parsed.success) {
        Logger.error({
            message: "Input rejected by Zod",
            path: "addGameRecap.route.ts",
            errorType: "zod",
            error: parsed.error,
        });
        return res.status(400).send({ message: "Invalid input!" });
    }
    Logger.log({
        message: `Trying to add game recap`,
        path: "addGameRecap.route.ts",
        json: { parsed: parsed.data },
    });
    try {
        const gameRecapData = parsed.data;
        const [game, player] = await Promise.all([
            addGameIfNotExist(gameRecapData.game),
            addPlayerIfNotExist(gameRecapData.player),
        ]);

        const existingRecap = await prisma.gameRecap.findUnique({
            where: {
                game_id_player_id: {
                    game_id: game.id,
                    player_id: player.id,
                },
            },
        });
        if (existingRecap) {
            const playerXp = await prisma.player.findUniqueOrThrow({
                where: { id: player.id },
                select: { xp: true },
            });
            const xpData = getLevelDataFromXp(playerXp.xp);
            return res.status(200).send({
                oldXpData: xpData,
                newXpData: xpData,
                creditsEarned: 0,
                idempotent: true,
            } satisfies {
                oldXpData: ExperienceData;
                newXpData: ExperienceData;
                creditsEarned: number;
                idempotent: boolean;
            });
        }

        Logger.log({
            message: `Inserting game recap`,
            path: "addGameRecap.route.ts",
        });

        try {
            await prisma.gameRecap.create({
                data: {
                    game_id: game.id,
                    player_id: player.id,
                    died_at: new Date(gameRecapData.diedAt),
                    words_count: gameRecapData.wordsCount,
                    flips_count: gameRecapData.flipsCount,
                    depleted_syllables_count: gameRecapData.depletedSyllablesCount,
                    alpha_count: gameRecapData.alphaCount,
                    words_without_death_count: gameRecapData.wordsWithoutDeathCount,
                    previous_syllables_count: gameRecapData.previousSyllablesCount,
                    multi_syllables_count: gameRecapData.multiSyllablesCount,
                    hyphen_words_count: gameRecapData.hyphenWordsCount,
                    more_than_20_letters_words_count: gameRecapData.moreThan20LettersWordsCount,
                    slurs_count: gameRecapData.slursCount,
                    creatures_count: gameRecapData.creaturesCount,
                    ethnonyms_count: gameRecapData.ethnonymsCount,
                    chemicals_count: gameRecapData.chemicalsCount,
                    plants_count: gameRecapData.plantsCount,
                    foods_count: gameRecapData.foodsCount,
                    adverbs_count: gameRecapData.adverbsCount,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                const playerXp = await prisma.player.findUniqueOrThrow({
                    where: { id: player.id },
                    select: { xp: true },
                });
                const xpData = getLevelDataFromXp(playerXp.xp);
                return res.status(200).send({
                    oldXpData: xpData,
                    newXpData: xpData,
                    creditsEarned: 0,
                    idempotent: true,
                });
            }
            throw error;
        }

        const listedRecordsTotalCount =
            gameRecapData.hyphenWordsCount +
            gameRecapData.moreThan20LettersWordsCount +
            gameRecapData.slursCount +
            gameRecapData.creaturesCount +
            gameRecapData.ethnonymsCount +
            gameRecapData.chemicalsCount +
            gameRecapData.plantsCount +
            gameRecapData.foodsCount +
            gameRecapData.adverbsCount;
        const gainedExperience = calculateXpFromGameRecap({
            mode: gameRecapData.game.mode,
            time: gameRecapData.diedAt - game.started_at.getTime(),
            wordsCount: gameRecapData.wordsCount,
            flipsCount: gameRecapData.flipsCount,
            depletedSyllablesCount: gameRecapData.depletedSyllablesCount,
            alphaCount: gameRecapData.alphaCount,
            wordsWithoutDeathCount: gameRecapData.wordsWithoutDeathCount,
            previousSyllablesCount: gameRecapData.previousSyllablesCount,
            multiSyllablesCount: gameRecapData.multiSyllablesCount,
            listedRecordsTotalCount,
        });

        const playerXp: { xp: number }[] = await prisma.$queryRaw`
            SELECT xp FROM player
            WHERE id = ${player.id}::UUID
        `;
        const currentXp = playerXp[0]!.xp;
        const currentXpData = getLevelDataFromXp(currentXp);

        const xpLedger = await mutateXp({
            playerId: player.id,
            operation: "ADD",
            amount: gainedExperience,
            reason: "game-recap",
            idempotencyKey: `game-recap-xp:${game.id}:${player.id}`,
            actor: "game-recap",
            metadata: {
                wordsCount: gameRecapData.wordsCount,
                mode: gameRecapData.game.mode,
                language: gameRecapData.game.lang,
            },
        });
        const newXpData = getLevelDataFromXp(xpLedger.xp_after);

        const creditsEarned = calculateCreditsFromGameRecap({
            mode: gameRecapData.game.mode,
            wordsCount: gameRecapData.wordsCount,
            flipsCount: gameRecapData.flipsCount,
            depletedSyllablesCount: gameRecapData.depletedSyllablesCount,
            alphaCount: gameRecapData.alphaCount,
            wordsWithoutDeathCount: gameRecapData.wordsWithoutDeathCount,
            previousSyllablesCount: gameRecapData.previousSyllablesCount,
            multiSyllablesCount: gameRecapData.multiSyllablesCount,
            listedRecordsTotalCount,
        });
        if (creditsEarned > 0) {
            await mutateCredits({
                playerId: player.id,
                amount: creditsEarned,
                reason: "game-recap",
                reference: game.id,
                idempotencyKey: `game-recap-credits:${game.id}:${player.id}`,
                actor: "game-recap",
                metadata: {
                    wordsCount: gameRecapData.wordsCount,
                    mode: gameRecapData.game.mode,
                    language: gameRecapData.game.lang,
                },
            });
        }

        let shouldRefreshLeaderboard = true;
        try {
            shouldRefreshLeaderboard = await hasLeaderboardPersonalBest({
                playerId: player.id,
                language: languageEnumToDatabaseEnumMap[gameRecapData.game.lang],
                mode: modeEnumToDatabaseEnumMap[gameRecapData.game.mode],
                recap: gameRecapData,
                gameStartedAt: game.started_at,
            });
        } catch (error) {
            Logger.error({
                message: "Failed to check personal best; scheduling leaderboard refresh",
                path: "addGameRecap.route.ts",
                errorType: "unknown",
                error,
            });
        }
        if (shouldRefreshLeaderboard) {
            scheduleLeaderboardRefresh();
        }

        return res.status(200).send({
            oldXpData: currentXpData,
            newXpData: newXpData,
            creditsEarned,
        } satisfies {
            oldXpData: ExperienceData;
            newXpData: ExperienceData;
            creditsEarned: number;
        });
    } catch (e) {
        Logger.error({
            message: "Failed to add game recap",
            path: "addGameRecap.route.ts",
            errorType: "unknown",
            error: e,
        });
        return res.status(500).send({ message: "Failed to add game recap" });
    }
};
