import { API_KEY, API_URL } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ recapId: string }> }) {
    const { recapId } = await params;
    const apiResponse = await fetch(`${API_URL}/game-recaps/${encodeURIComponent(recapId)}/export`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });

    const json = await apiResponse.json();
    return NextResponse.json(json, { status: apiResponse.status });
}
