import { API_KEY, API_URL } from "./env";

export function getFromApi(url: string) {
    return fetch(`${API_URL}${url}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });
}

export function postToApi(url: string, body: any, method: "POST" | "PUT" | "DELETE") {
    return fetch(`${API_URL}${url}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
    });
}
