import prisma from "../prisma";

export default async function findPlayerByUsername(username: string) {
    type Result = { player_id: string; username: string }[];

    const exactAccountNameMatchPlayersQuery = prisma.$queryRaw<Result>`SELECT p.id as player_id, p.account_name as username FROM player p WHERE p.account_name ILIKE ${username};`;
    const latestExactMatchPlayersQuery = prisma.$queryRaw<Result>`SELECT plu.player_id, plu.username FROM player_latest_username plu WHERE plu.username ILIKE ${username};`;
    const latestStartWithPlayersQuery = prisma.$queryRaw<Result>`SELECT plu.player_id, plu.username FROM player_latest_username plu WHERE plu.username ILIKE ${username} || '%';`;
    const latestContainsPlayersQuery = prisma.$queryRaw<Result>`SELECT plu.player_id, plu.username FROM player_latest_username plu WHERE plu.username ILIKE '%' || ${username} || '%';`;
    const anyExactMatchPlayersQuery = prisma.$queryRaw<Result>`SELECT pu.player_id, pu.username FROM player_username pu INNER JOIN player p ON p.id = pu.player_id WHERE pu.username ILIKE ${username};`;
    const anyStartWithPlayersQuery = prisma.$queryRaw<Result>`SELECT pu.player_id, pu.username FROM player_username pu INNER JOIN player p ON p.id = pu.player_id WHERE pu.username ILIKE ${username} || '%';`;
    const anyContainsPlayersQuery = prisma.$queryRaw<Result>`SELECT pu.player_id, pu.username FROM player_username pu INNER JOIN player p ON p.id = pu.player_id WHERE pu.username ILIKE '%' || ${username} || '%';`;

    const [
        exactAccountNameMatchPlayers,
        latestExactMatchPlayers,
        latestStartWithPlayers,
        latestContainsPlayers,
        anyExactMatchPlayers,
        anyStartWithPlayers,
        anyContainsPlayers,
    ] = await Promise.all([
        exactAccountNameMatchPlayersQuery,
        latestExactMatchPlayersQuery,
        latestStartWithPlayersQuery,
        latestContainsPlayersQuery,
        anyExactMatchPlayersQuery,
        anyStartWithPlayersQuery,
        anyContainsPlayersQuery,
    ]);

    let bestArray;

    if (exactAccountNameMatchPlayers.length) {
        // Exact match on account name
        bestArray = exactAccountNameMatchPlayers;
    } else if (latestExactMatchPlayers.length) {
        // Exact match on latest username
        bestArray = latestExactMatchPlayers;
    } else if (latestStartWithPlayers.length) {
        // Match on latest username starting with the given username
        bestArray = latestStartWithPlayers;
    } else if (anyExactMatchPlayers.length) {
        // Match on any name used by the player ever
        bestArray = anyExactMatchPlayers;
    } else if (anyStartWithPlayers.length) {
        // Match on any name used by the player ever starting with the given username
        bestArray = anyStartWithPlayers;
    } else if (latestContainsPlayers.length) {
        // Match on latest username containing the given username
        bestArray = latestContainsPlayers;
    } else if (anyContainsPlayers.length) {
        // Match on any name used by the player ever containing the given username
        bestArray = anyContainsPlayers;
    } else {
        return null;
    }

    return bestArray[0];
}
