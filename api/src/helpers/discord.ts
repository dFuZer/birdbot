export function getDiscordAvatarUrl(userId: string | null, avatarHash: string | null): string | undefined {
    if (!userId || !avatarHash) {
        return undefined;
    }

    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.jpg?size=1024`;
}
