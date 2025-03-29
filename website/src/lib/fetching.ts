import { API_KEY, API_URL } from "./env";

export function getFromApi(url: string) {
    return fetch(`${API_URL}${url}`, {
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });
}
