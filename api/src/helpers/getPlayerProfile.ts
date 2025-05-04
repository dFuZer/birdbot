import prisma from "../prisma";
import { TLanguage, TMode } from "../schemas/records.zod";
import { languageEnumToDatabaseEnumMap, modeEnumToDatabaseEnumMap } from "./maps";

export default async function getPlayerProfile({
    playerId,
    mode,
    language,
}: {
    playerId: string;
    mode: TMode;
    language: TLanguage;
}) {
    const playerQuery: { id: string; account_name: string; xp: number; username: string }[] =
        await prisma.$queryRaw`SELECT p.id, p.account_name, plu.username, p.xp FROM player p INNER JOIN player_latest_username plu ON plu.player_id = p.id WHERE p.id = ${playerId}::UUID LIMIT 1`;
    const player = playerQuery[0];

    if (!player) {
        return null;
    }

    const records: { record_type: string; score: number; rank: number }[] = await prisma.$queryRaw`
        SELECT record_type, score, rank 
        FROM leaderboard
        WHERE player_id = ${player.id}::UUID
        AND language = ${languageEnumToDatabaseEnumMap[language]}::"language"
        AND mode = ${modeEnumToDatabaseEnumMap[mode]}::"game_mode"
    `;

    return {
        playerId: player.id,
        playerAccountName: player.account_name,
        playerUsername: player.username,
        xp: player.xp,
        language,
        mode,
        records,
    };
}
