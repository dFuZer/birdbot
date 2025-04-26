import { API_KEY, API_URL } from "./env";

export function getFromApi(url: string) {
    console.log(API_KEY);
    return fetch(`${API_URL}${url}`, {
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postJsonToApi(url: string, body: any) {
    return fetch(`${API_URL}${url}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
}
