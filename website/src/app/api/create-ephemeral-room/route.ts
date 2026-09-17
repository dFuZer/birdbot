import { API_KEY, BOT_API_URL } from "@/lib/env";
import { languageEnumSchema, modesEnumSchema } from "@/lib/records";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
    language: languageEnumSchema,
    mode: modesEnumSchema,
});
const responseSchema = z.object({ roomCode: z.string().min(1).max(16) });

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const requestsByIp = new Map<string, number[]>();

function getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    return forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function reserveRateLimitSlot(ip: string): { allowed: boolean; timestamp?: number; retryAfterSeconds?: number } {
    const now = Date.now();
    if (requestsByIp.size > 1_000) {
        for (const [storedIp, timestamps] of requestsByIp) {
            if (timestamps.every((timestamp) => now - timestamp >= RATE_LIMIT_WINDOW_MS)) {
                requestsByIp.delete(storedIp);
            }
        }
    }
    const recentRequests = (requestsByIp.get(ip) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
        requestsByIp.set(ip, recentRequests);
        return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil((recentRequests[0] + RATE_LIMIT_WINDOW_MS - now) / 1000)),
        };
    }
    recentRequests.push(now);
    requestsByIp.set(ip, recentRequests);
    return { allowed: true, timestamp: now };
}

function releaseRateLimitSlot(ip: string, timestamp: number): void {
    const requests = requestsByIp.get(ip);
    if (!requests) return;
    const reservationIndex = requests.indexOf(timestamp);
    if (reservationIndex !== -1) requests.splice(reservationIndex, 1);
    if (requests.length === 0) requestsByIp.delete(ip);
}

export async function POST(request: NextRequest) {
    let rawBody: unknown;
    try {
        rawBody = await request.json();
    } catch {
        return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    const body = requestSchema.safeParse(rawBody);
    if (!body.success) {
        return NextResponse.json({ message: "Invalid language or mode" }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const rateLimit = reserveRateLimitSlot(clientIp);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { message: "You can create at most 3 temporary rooms per minute" },
            {
                status: 429,
                headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
            },
        );
    }

    try {
        const botResponse = await fetch(`${BOT_API_URL}/rooms/ephemeral`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body.data),
            cache: "no-store",
        });
        const payload: unknown = await botResponse.json().catch(() => null);
        if (!botResponse.ok) {
            releaseRateLimitSlot(clientIp, rateLimit.timestamp!);
            const message =
                payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
                    ? payload.message
                    : "Room creation failed";
            return NextResponse.json({ message }, { status: botResponse.status });
        }
        const parsedResponse = responseSchema.safeParse(payload);
        if (!parsedResponse.success) {
            releaseRateLimitSlot(clientIp, rateLimit.timestamp!);
            return NextResponse.json({ message: "Invalid response from the bot" }, { status: 502 });
        }
        return NextResponse.json(parsedResponse.data, { status: 201 });
    } catch {
        releaseRateLimitSlot(clientIp, rateLimit.timestamp!);
        return NextResponse.json({ message: "The bot is unavailable" }, { status: 503 });
    }
}
