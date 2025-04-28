import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI as string,
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID as string,
        EXPERIMENTAL_FEATURES_ENABLED: process.env.EXPERIMENTAL_FEATURES_ENABLED === "true",
    });
}
