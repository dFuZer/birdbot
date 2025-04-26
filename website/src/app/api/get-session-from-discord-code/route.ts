import { postJsonToApi } from "@/lib/fetching";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();
    const { code } = body;

    const response = await postJsonToApi("/get-session-cookie-discord", { code });

    const data: { cookie: string } = await response.json();

    const cookieStore = await cookies();
    cookieStore.set("session", data.cookie, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        httpOnly: true,
        path: "/",
    });

    return NextResponse.json({ message: "Session cookie fetched successfully!" });
}
