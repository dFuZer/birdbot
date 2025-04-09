"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
    const params = useSearchParams();
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>(undefined);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (sent) return;

        const code = params.get("code");

        if (!code) {
            setError("No code found");
            return;
        }

        setSent(true);

        console.log({ code });
    }, [params]);

    // console.log({
    //     client_id: DISCORD_CLIENT_ID,
    //     client_secret: DISCORD_CLIENT_SECRET,
    //     code,
    //     redirect_uri: DISCORD_REDIRECT_URI,
    // });

    // const token = await fetch(`https://discord.com/api/oauth2/token`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //     body: new URLSearchParams({
    //         client_id: DISCORD_CLIENT_ID,
    //         client_secret: DISCORD_CLIENT_SECRET,
    //         code,
    //         redirect_uri: DISCORD_REDIRECT_URI,
    //         grant_type: "authorization_code",
    //     }),
    // });

    // const data = await token.json();
    // const accessToken = data.access_token;

    // const userResponse = await fetch("https://discord.com/api/users/@me", {
    //     headers: {
    //         Authorization: `Bearer ${accessToken}`,
    //     },
    // });

    // const userData = await userResponse.json();

    // console.log("Discord ID: ", userData.id);

    return <div>callback processing. code: {code}</div>;
}
