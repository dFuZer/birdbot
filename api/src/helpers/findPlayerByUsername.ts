import prisma from "../prisma";

export default async function findPlayerByUsername(username: string): Promise<{ id: string; username: string } | null> {
    const usernameLower = username.toLowerCase();

    const playersQuery: { player_id: string; account_name: string; latest_username: string }[] =
        await prisma.$queryRaw`SELECT p.id as player_id, p.account_name, p.metadata->>'latest_username' as latest_username FROM player p WHERE p.account_name ILIKE ${username} OR p.metadata->>'latest_username' ILIKE '%' || ${username} || '%';`;
    const usernamesQuery: { player_id: string; username: string }[] =
        await prisma.$queryRaw`SELECT pu.player_id, pu.username FROM player_username pu WHERE pu.username ILIKE '%' || ${username} || '%';`;

    const exactAccountNameMatchPlayer = playersQuery.find((player) => player.account_name.toLowerCase() === usernameLower);

    if (exactAccountNameMatchPlayer) {
        return {
            id: exactAccountNameMatchPlayer.player_id,
            username: exactAccountNameMatchPlayer.account_name,
        };
    }

    const latestUsernameMatchPlayer = playersQuery.find((player) => player.latest_username.toLowerCase() === usernameLower);

    if (latestUsernameMatchPlayer) {
        return {
            id: latestUsernameMatchPlayer.player_id,
            username: latestUsernameMatchPlayer.latest_username,
        };
    }

    const latestStartWithPlayer = playersQuery.find((player) => player.latest_username.toLowerCase().startsWith(usernameLower));

    if (latestStartWithPlayer) {
        return {
            id: latestStartWithPlayer.player_id,
            username: latestStartWithPlayer.latest_username,
        };
    }

    const latestContainsPlayer = playersQuery.find((player) => player.latest_username.toLowerCase().includes(usernameLower));

    if (latestContainsPlayer) {
        return {
            id: latestContainsPlayer.player_id,
            username: latestContainsPlayer.latest_username,
        };
    }

    const anyExactMatchPlayer = usernamesQuery.find((username) => username.username.toLowerCase() === usernameLower);

    if (anyExactMatchPlayer) {
        return {
            id: anyExactMatchPlayer.player_id,
            username: anyExactMatchPlayer.username,
        };
    }

    const anyStartWithPlayer = usernamesQuery.find((username) => username.username.toLowerCase().startsWith(usernameLower));

    if (anyStartWithPlayer) {
        return {
            id: anyStartWithPlayer.player_id,
            username: anyStartWithPlayer.username,
        };
    }

    const anyContainsPlayer = usernamesQuery.find((username) => username.username.toLowerCase().includes(usernameLower));

    if (anyContainsPlayer) {
        return {
            id: anyContainsPlayer.player_id,
            username: anyContainsPlayer.username,
        };
    }

    return null;
}
