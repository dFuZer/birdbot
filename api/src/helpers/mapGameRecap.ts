import { Prisma } from "@prisma/client";
import { databaseEnumToLanguageEnumMap, databaseEnumToModeEnumMap, PrismaGameMode, PrismaLanguage } from "./maps";

export type GameRecapListRow = {
    id: string;
    game_id: string;
    player_id: string;
    died_at: Date;
    words_count: number;
    flips_count: number;
    depleted_syllables_count: number;
    alpha_count: number;
    words_without_death_count: number;
    previous_syllables_count: number;
    multi_syllables_count: number;
    hyphen_words_count: number;
    more_than_20_letters_words_count: number;
    slurs_count: number;
    creatures_count: number;
    ethnonyms_count: number;
    chemicals_count: number;
    plants_count: number;
    adverbs_count: number;
    foods_count: number;
    language: PrismaLanguage;
    mode: PrismaGameMode;
    started_at: Date;
    ended_at: Date | null;
    account_name: string;
    username: string | null;
    duration_ms: number | bigint;
};

export function mapGameRecapRow(row: GameRecapListRow) {
    return {
        id: row.id,
        gameId: row.game_id,
        playerId: row.player_id,
        accountName: row.account_name,
        username: row.username ?? row.account_name,
        language: databaseEnumToLanguageEnumMap[row.language],
        mode: databaseEnumToModeEnumMap[row.mode],
        startedAt: row.started_at.toISOString(),
        endedAt: row.ended_at?.toISOString() ?? null,
        diedAt: row.died_at.toISOString(),
        wordsCount: row.words_count,
        flipsCount: row.flips_count,
        depletedSyllablesCount: row.depleted_syllables_count,
        alphaCount: row.alpha_count,
        wordsWithoutDeathCount: row.words_without_death_count,
        previousSyllablesCount: row.previous_syllables_count,
        multiSyllablesCount: row.multi_syllables_count,
        hyphenWordsCount: row.hyphen_words_count,
        moreThan20LettersWordsCount: row.more_than_20_letters_words_count,
        slursCount: row.slurs_count,
        creaturesCount: row.creatures_count,
        ethnonymsCount: row.ethnonyms_count,
        chemicalsCount: row.chemicals_count,
        plantsCount: row.plants_count,
        adverbsCount: row.adverbs_count,
        foodsCount: row.foods_count,
        durationMs: Number(row.duration_ms),
    };
}

export const gameRecapSelectSql = Prisma.raw(`
    gr.id,
    gr.game_id,
    gr.player_id,
    gr.died_at,
    gr.words_count,
    gr.flips_count,
    gr.depleted_syllables_count,
    gr.alpha_count,
    gr.words_without_death_count,
    gr.previous_syllables_count,
    gr.multi_syllables_count,
    gr.hyphen_words_count,
    gr.more_than_20_letters_words_count,
    gr.slurs_count,
    gr.creatures_count,
    gr.ethnonyms_count,
    gr.chemicals_count,
    gr.plants_count,
    gr.adverbs_count,
    gr.foods_count,
    g.language,
    g.mode,
    g.started_at,
    g.ended_at,
    p.account_name,
    p.metadata->>'latest_username' AS username,
    CAST(EXTRACT(EPOCH FROM (gr.died_at - g.started_at)) * 1000 AS bigint) AS duration_ms
`);
