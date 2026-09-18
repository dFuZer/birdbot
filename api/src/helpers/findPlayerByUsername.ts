import prisma from "../prisma";

export default async function findPlayerByUsername(username: string): Promise<{ id: string; username: string } | null> {
    const usernameLower = username.toLowerCase();

    const playersQuery: {
        player_id: string;
        auth_id: string;
        profile_name: string | null;
        latest_username: string | null;
    }[] = await prisma.$queryRaw`
        SELECT p.id as player_id, p.auth_id, p.metadata->>'profile_name' as profile_name,
               p.metadata->>'latest_username' as latest_username
        FROM player p
        WHERE p.auth_id ILIKE ${username}
           OR p.metadata->>'profile_name' ILIKE '%' || ${username} || '%'
           OR p.metadata->>'latest_username' ILIKE '%' || ${username} || '%'
    `;
    const usernamesQuery: { player_id: string; username: string }[] =
        await prisma.$queryRaw`SELECT pu.player_id, pu.username FROM player_username pu WHERE pu.username ILIKE '%' || ${username} || '%';`;

    const exactAuthIdMatchPlayer = playersQuery.find((player) => player.auth_id.toLowerCase() === usernameLower);

    if (exactAuthIdMatchPlayer) {
        return {
            id: exactAuthIdMatchPlayer.player_id,
            username: exactAuthIdMatchPlayer.auth_id,
        };
    }

    const profileNameMatchPlayer = playersQuery.find(
        (player) => player.profile_name?.toLowerCase() === usernameLower,
    );
    if (profileNameMatchPlayer) {
        return { id: profileNameMatchPlayer.player_id, username: profileNameMatchPlayer.profile_name! };
    }

    const latestUsernameMatchPlayer = playersQuery.find(
        (player) => player.latest_username?.toLowerCase() === usernameLower,
    );

    if (latestUsernameMatchPlayer) {
        return {
            id: latestUsernameMatchPlayer.player_id,
            username: latestUsernameMatchPlayer.latest_username!,
        };
    }

    const profileStartsWithPlayer = playersQuery.find((player) =>
        player.profile_name?.toLowerCase().startsWith(usernameLower),
    );
    if (profileStartsWithPlayer) {
        return { id: profileStartsWithPlayer.player_id, username: profileStartsWithPlayer.profile_name! };
    }

    const latestStartWithPlayer = playersQuery.find((player) =>
        player.latest_username?.toLowerCase().startsWith(usernameLower),
    );

    if (latestStartWithPlayer) {
        return {
            id: latestStartWithPlayer.player_id,
            username: latestStartWithPlayer.latest_username!,
        };
    }

    const profileContainsPlayer = playersQuery.find((player) =>
        player.profile_name?.toLowerCase().includes(usernameLower),
    );
    if (profileContainsPlayer) {
        return { id: profileContainsPlayer.player_id, username: profileContainsPlayer.profile_name! };
    }

    const latestContainsPlayer = playersQuery.find((player) =>
        player.latest_username?.toLowerCase().includes(usernameLower),
    );

    if (latestContainsPlayer) {
        return {
            id: latestContainsPlayer.player_id,
            username: latestContainsPlayer.latest_username!,
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
