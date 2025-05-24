import crypto from "crypto";

export function randomUUID() {
    return crypto.randomUUID();
}

export function generateSessionToken(length: number = 50) {
    return crypto.randomBytes(length).toString("hex");
}

export function generatePlayerLinkToken(length: number = 50) {
    return crypto.randomBytes(length).toString("hex");
}
