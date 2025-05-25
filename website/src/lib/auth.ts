"use server";

import { API_KEY, API_URL } from "@/lib/env";
import { cookies } from "next/headers";
import { ExperienceData } from "./records";

export interface IMyPlayerProfileData {
    playerData?: {
        username: string;
        xp: ExperienceData;
        id: string;
    };
    linkingToken?: string;
    websiteUserData: {
        username: string;
        provider: string;
        globalName: string;
        avatarUrl: string;
    };
}

export async function getAuthDataAction() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) {
        return null;
    }
    const res = await fetch(`${API_URL}/user?sessionToken=${token}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });

    if (!res.ok) {
        return null;
    }

    const data: IMyPlayerProfileData = await res.json();

    return data;
}

export async function disconnectAction() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}
