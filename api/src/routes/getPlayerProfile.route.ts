import { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import findPlayerByUsername from "../helpers/findPlayerByUsername";
import { getPlayerPreferredCategory } from "../helpers/getPlayerPreferredCategory";
import getPlayerProfile from "../helpers/getPlayerProfile";
import { databaseFieldToRecordEnumMap, GameRecapRecordField } from "../helpers/maps";
import prisma from "../prisma";
import { languageEnumSchema, modeEnumSchema } from "../schemas/records.zod";

export let getPlayerProfileRouteHandler: RouteHandlerMethod = async function (req, res) {
    const requestQuery = req.query;
    const parsedData = z
        .object({
            name: z.string(),
            language: languageEnumSchema.optional(),
            mode: modeEnumSchema.optional(),
        })
        .or(
            z.object({
                playerId: z.string(),
                language: languageEnumSchema.optional(),
                mode: modeEnumSchema.optional(),
            })
        )
        .safeParse(requestQuery);

    if (!parsedData.success) {
        return res.status(400).send({ message: "Invalid params" });
    }

    let searchPlayerId: string | null = null;
    let foundUsername: string | null = null;

    if ("playerId" in parsedData.data) {
        searchPlayerId = parsedData.data.playerId;
    } else {
        const bestPlayerMatch = await findPlayerByUsername(parsedData.data.name);

        if (!bestPlayerMatch) {
            return res.status(404).send({ message: "Player not found" });
        }

        searchPlayerId = bestPlayerMatch.player_id;
        foundUsername = bestPlayerMatch.username;
    }

    const playerVerificationQuery: { id: string }[] =
        await prisma.$queryRaw`SELECT id FROM player WHERE id = ${searchPlayerId}::UUID LIMIT 1;`;

    if (!playerVerificationQuery[0]) {
        return res.status(404).send({ message: "Player not found" });
    }

    const { language, mode } = parsedData.data;

    const searchCategories = await getPlayerPreferredCategory({
        playerId: searchPlayerId,
        targetLanguage: language,
        targetMode: mode,
    });

    const profileData = await getPlayerProfile({
        language: searchCategories.language,
        mode: searchCategories.mode,
        playerId: searchPlayerId,
    });

    if (!profileData) {
        return res.status(404).send({ message: "Player not found" });
    }

    const finalProfileData = {
        foundUsername: "name" in parsedData.data && foundUsername ? foundUsername : profileData.playerUsername,
        ...profileData,
        records: profileData.records.map((record) => ({
            ...record,
            record_type: databaseFieldToRecordEnumMap[record.record_type as GameRecapRecordField],
        })),
    };

    return res.status(200).send(finalProfileData);
};
