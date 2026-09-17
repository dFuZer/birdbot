export function encodeCursor(payload: Record<string, string>) {
    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | undefined): Record<string, string> | null {
    if (!cursor) {
        return null;
    }

    try {
        const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
        if (!parsed || typeof parsed !== "object") {
            return null;
        }
        const record = parsed as Record<string, unknown>;
        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(record)) {
            if (typeof value !== "string") {
                return null;
            }
            result[key] = value;
        }
        return result;
    } catch {
        return null;
    }
}

export function sanitizeSearch(query: string) {
    return query.trim().slice(0, 50).replace(/[%_]/g, "");
}
