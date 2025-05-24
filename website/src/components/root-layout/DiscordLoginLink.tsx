"use client";

import { PublicEnvironmentVariablesContext } from "@/components/providers/PublicEnvironmentVariablesProvider";
import { Button } from "@/components/ui/button";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import { useContext, useMemo } from "react";

export default function DiscordLoginLink() {
    const { DISCORD_REDIRECT_URI, DISCORD_CLIENT_ID } = useContext(PublicEnvironmentVariablesContext);

    const loginLink = useMemo(() => {
        return `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID ?? "loading"}&response_type=code&redirect_uri=${DISCORD_REDIRECT_URI ? encodeURIComponent(DISCORD_REDIRECT_URI) : "loading"}&scope=identify`;
    }, [DISCORD_REDIRECT_URI, DISCORD_CLIENT_ID]);

    return (
        <Link href={loginLink}>
            <Button variant={"ghost"}>
                <span>Log in</span>
                <SiDiscord className="size-4" />
            </Button>
        </Link>
    );
}
