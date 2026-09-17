import { API_KEY, API_URL } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = await params;
    const { searchParams } = new URL(request.url);
    const query = new URLSearchParams();
    const cursor = searchParams.get("cursor");
    const limit = searchParams.get("limit");
    const playerId = searchParams.get("playerId");
    const successOnly = searchParams.get("successOnly");

    if (cursor) query.set("cursor", cursor);
    if (limit) query.set("limit", limit);
    if (playerId) query.set("playerId", playerId);
    if (successOnly) query.set("successOnly", successOnly);

    const suffix = query.toString();
    const apiResponse = await fetch(`${API_URL}/games/${encodeURIComponent(gameId)}/words${suffix ? `?${suffix}` : ""}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });

    const json = await apiResponse.json();
    return NextResponse.json(json, { status: apiResponse.status });
}
