"use server";

import { API_KEY, API_URL } from "@/lib/env";
import { cookies } from "next/headers";
import { ExperienceData } from "./records";

export interface IMyPlayerProfileData {
    playerData?: {
        avatarUrl?: string;
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
    console.log("Token", token);
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
        console.log("Error fetching user data", res.status, res.statusText);
        return null;
    }

    const data: IMyPlayerProfileData = await res.json();

    console.log("User data fetched", data);

    return data;
}

export async function disconnectAction() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}
