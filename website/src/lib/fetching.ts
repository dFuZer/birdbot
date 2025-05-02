import { API_KEY, API_URL } from "./env";

export function getFromApi(url: string) {
    console.log(API_KEY);
    return fetch(`${API_URL}${url}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postToApi(url: string, body: any, method: "POST" | "PUT" | "DELETE") {
    return fetch(`${API_URL}${url}`, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
}
