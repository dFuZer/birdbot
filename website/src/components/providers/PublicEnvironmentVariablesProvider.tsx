"use client";

import { createContext, useEffect, useState } from "react";

type PublicEnvironmentVariables = {
    DISCORD_REDIRECT_URI: string;
    DISCORD_CLIENT_ID: string;
    EXPERIMENTAL_FEATURES_ENABLED: boolean;
};

export const PublicEnvironmentVariablesContext = createContext<PublicEnvironmentVariables>({
    DISCORD_REDIRECT_URI: "",
    DISCORD_CLIENT_ID: "",
    EXPERIMENTAL_FEATURES_ENABLED: false,
});

export default function PublicEnvironmentVariablesProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [env, setEnv] = useState<PublicEnvironmentVariables>({
        DISCORD_REDIRECT_URI: "",
        DISCORD_CLIENT_ID: "",
        EXPERIMENTAL_FEATURES_ENABLED: false,
    });

    useEffect(() => {
        fetch("/api/get-public-env")
            .then((res) => res.json())
            .then((data: PublicEnvironmentVariables) => {
                setEnv(data);
            });
    }, []);

    return <PublicEnvironmentVariablesContext.Provider value={env}>{children}</PublicEnvironmentVariablesContext.Provider>;
}
