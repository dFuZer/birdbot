import { Prisma } from "@prisma/client";
import { z } from "zod";
import Logger from "../lib/logger";
import prisma from "../prisma/client";
import { getRecords, languages, modes, type TRecord } from "../schemas/records.zod";

type TOrderByField = Exclude<TRecord, "TIME">;

const recordEnumToDatabaseFieldMap: { [key in TOrderByField]: Prisma.GameRecapScalarFieldEnum } = {
    ALPHA: Prisma.GameRecapScalarFieldEnum.alpha_count,
    DEPLETED_SYLLABLES: Prisma.GameRecapScalarFieldEnum.depleted_syllables_count,
    WORD: Prisma.GameRecapScalarFieldEnum.words_count,
    MULTI_SYLLABLE: Prisma.GameRecapScalarFieldEnum.multi_syllables_count,
    PREVIOUS_SYLLABLE: Prisma.GameRecapScalarFieldEnum.previous_syllables_count,
    FLIPS: Prisma.GameRecapScalarFieldEnum.flips_count,
    HYPHEN: Prisma.GameRecapScalarFieldEnum.hyphen_words_count,
    NO_DEATH: Prisma.GameRecapScalarFieldEnum.words_without_death_count,
    MORE_THAN_20_LETTERS: Prisma.GameRecapScalarFieldEnum.more_than_20_letters_words_count,
};

type Results = {
    player_id: string;
    player_nickname: string;
    game_id: string;
    score: number;
}[];

export default async function getBestScoresForCategory(params: z.infer<typeof getRecords>) {
    const { mode, lang, page, perPage, record } = params;

    if (record === "TIME") {
        const bestScores: Results = await prisma.$queryRaw`
            SELECT DISTINCT ON (player.id)
            player.id AS player_id, player.auth_nickname AS player_nickname, game.id AS game_id, EXTRACT(EPOCH FROM (game_recap.died_at - game.started_at)) * 1000 as score
            FROM game_recap
            INNER JOIN game
            ON game_recap.game_id = game.id
            INNER JOIN player
            ON game_recap.player_id = player.id
            WHERE game.language = ${lang}::"language"
            AND game.mode = ${mode}::"game_mode"
            LIMIT ${perPage}
            OFFSET ${(page - 1) * perPage}
        `;
        return bestScores;
    } else {
        const selectedRecordColumn = recordEnumToDatabaseFieldMap[record as TOrderByField];
        const potentialOrderByValues = Object.values(Prisma.GameRecapScalarFieldEnum);

        // Should be useless, but you can never be too sure ^^
        if (!potentialOrderByValues.includes(selectedRecordColumn) || !languages.safeParse(lang).success || !modes.safeParse(mode).success || typeof perPage !== "number" || typeof page !== "number") {
            const e = new Error("Unsafe arguments");
            Logger.error({ message: "Unsafe arguments", path: "getBestScoresForRecord.ts", errorType: "unknown", error: e });
            throw e;
        }

        const bestScores: Results = await prisma.$queryRawUnsafe(`
            SELECT DISTINCT ON (player.id)
            player.id AS player_id, player.auth_nickname AS player_nickname, game.id AS game_id, game_recap."${selectedRecordColumn}" as score
            FROM game_recap
            INNER JOIN game
            ON game_recap.game_id = game.id
            INNER JOIN player
            ON game_recap.player_id = player.id
            WHERE game.language = '${lang}'::"language"
            AND game.mode = '${mode}'::"game_mode"
            ORDER BY game_recap."${selectedRecordColumn}" DESC
            LIMIT ${perPage}
            OFFSET ${(page - 1) * perPage}
        `);

        return bestScores;
    }
}
