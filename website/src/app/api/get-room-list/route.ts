import { API_KEY, BOT_API_URL } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET() {
    const apiResponse = await fetch(`${BOT_API_URL}/room-list`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });
    const json = await apiResponse.json();

    return NextResponse.json(json);
}
