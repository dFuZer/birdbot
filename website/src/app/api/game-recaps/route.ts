import { API_KEY, API_URL } from "@/lib/env";
import { NextResponse } from "next/server";

const FORWARDED_PARAMS = ["q", "cursor", "limit", "language", "mode", "minWords", "sort"] as const;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    for (const key of FORWARDED_PARAMS) {
        const value = searchParams.get(key);
        if (value) {
            params.set(key, value);
        }
    }

    const query = params.toString();
    const apiResponse = await fetch(`${API_URL}/game-recaps${query ? `?${query}` : ""}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });

    const json = await apiResponse.json();
    return NextResponse.json(json, { status: apiResponse.status });
}
