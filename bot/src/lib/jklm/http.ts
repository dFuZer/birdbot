import { jklmDomain } from "../constants/gameConstants";

const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;
const QUEUE_DELAY_MS = 2800;

type QueuedRequest = {
    run: () => Promise<void>;
    reject: (error: unknown) => void;
};

export class JklmHttpStatusError extends Error {
    public readonly path: string;
    public readonly status: number;
    public readonly responseBody: string;

    constructor(path: string, status: number, responseBody: string) {
        super(`JKLM API ${path} returned HTTP ${status}`);
        this.name = "JklmHttpStatusError";
        this.path = path;
        this.status = status;
        this.responseBody = responseBody;
    }
}

export class JklmResponseShapeError extends Error {
    public readonly path: string;
    public readonly responseBody: string;

    constructor(path: string, message: string, responseBody: string) {
        super(`JKLM API ${path} returned an invalid response: ${message}`);
        this.name = "JklmResponseShapeError";
        this.path = path;
        this.responseBody = responseBody;
    }
}

export type StartRoomResponse = {
    roomCode: string;
    url: string;
};

export type JoinRoomResponse = {
    url: string;
};

let queueRunning = false;
const requestQueue: QueuedRequest[] = [];

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function shouldRetry(error: unknown): boolean {
    if (error instanceof JklmResponseShapeError) return false;
    if (error instanceof JklmHttpStatusError) {
        return error.status === 408 || error.status === 429 || error.status >= 500;
    }
    return true;
}

async function postJson(path: string, body: Record<string, unknown>): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const response = await fetch(`https://${jklmDomain}${path}`, {
                method: "POST",
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" },
            });
            const responseBody = await response.text();
            if (!response.ok) {
                throw new JklmHttpStatusError(path, response.status, responseBody);
            }
            try {
                return JSON.parse(responseBody) as unknown;
            } catch {
                throw new JklmResponseShapeError(path, "body is not valid JSON", responseBody);
            }
        } catch (error) {
            lastError = error;
            if (attempt === MAX_ATTEMPTS || !shouldRetry(error)) throw error;
            await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
        }
    }
    throw lastError;
}

function queuedRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        requestQueue.push({
            run: async () => resolve(await request()),
            reject,
        });
        void pumpQueue();
    });
}

async function pumpQueue(): Promise<void> {
    if (queueRunning) return;
    queueRunning = true;
    try {
        while (requestQueue.length > 0) {
            const request = requestQueue.shift()!;
            try {
                await request.run();
            } catch (error) {
                request.reject(error);
            }
            if (requestQueue.length > 0) await delay(QUEUE_DELAY_MS);
        }
    } finally {
        queueRunning = false;
    }
}

function requireObject(path: string, value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new JklmResponseShapeError(path, "expected an object", JSON.stringify(value));
    }
    return value as Record<string, unknown>;
}

function requireString(path: string, object: Record<string, unknown>, key: string): string {
    const value = object[key];
    if (typeof value !== "string" || value.length === 0) {
        throw new JklmResponseShapeError(path, `expected a non-empty string at "${key}"`, JSON.stringify(object));
    }
    return value;
}

export async function discoverRoomServer(roomCode: string): Promise<JoinRoomResponse> {
    const path = "/api/joinRoom";
    const value = requireObject(path, await queuedRequest(() => postJson(path, { roomCode })));
    return { url: requireString(path, value, "url") };
}

export async function startRoom(body: {
    name: string;
    isPublic: boolean;
    gameId: "bombparty";
    creatorUserToken: string;
}): Promise<StartRoomResponse> {
    const path = "/api/startRoom";
    const value = requireObject(path, await queuedRequest(() => postJson(path, body)));
    return {
        roomCode: requireString(path, value, "roomCode"),
        url: requireString(path, value, "url"),
    };
}
