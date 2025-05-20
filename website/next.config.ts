import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
            },
        ],
    },
    turbopack: {
        rules: {
            "*.svg": {
                loaders: ["@svgr/webpack"],
                as: "*.js",
            },
        },
    },
    webpack(config) {
        // SVGR config
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const fileLoaderRule = config.module.rules.find((rule: any) => rule.test?.test?.(".svg"));

        config.module.rules.push(
            {
                ...fileLoaderRule,
                test: /\.svg$/i,
                resourceQuery: /url/,
            },
            {
                test: /\.svg$/i,
                issuer: fileLoaderRule.issuer,
                resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
                use: ["@svgr/webpack"],
            },
        );

        fileLoaderRule.exclude = /\.svg$/i;

        return config;
    },
};

export default nextConfig;
