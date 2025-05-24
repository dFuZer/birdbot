import { postToApi } from "@/lib/fetching";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();
    const { code } = body;

    const response = await postToApi("/auth-code", { code }, "POST");

    if (!response.ok) {
        return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
    }

    const data: { cookie: string } = await response.json();

    const cookieStore = await cookies();

    cookieStore.set("session", data.cookie, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        httpOnly: true,
        path: "/",
    });

    revalidateTag("user-data");

    return NextResponse.json({ message: "Session cookie fetched successfully!" });
}
