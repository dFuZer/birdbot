import { io, type Socket } from "socket.io-client";
import Logger from "../../lib/class/Logger.class";
import type { BirdBotLanguage } from "./BirdBotTypes";

const DEFS_SOCKET_URL = process.env.DEFS_SOCKET_URL || "https://defs.opnm.net:443";
/** Public token used by BBv7 against the shared defs.opnm.net service. */
const DEFS_AUTH_TOKEN = process.env.DEFS_AUTH_TOKEN || "QxvAdBSPYDRkgOPBqFLgopaVM1xxeiPcxieRBxe7ti6W43vGdJ";

const SUPPORTED_DEFINITION_LANGUAGES = ["fr", "en"] as const;
type SupportedDefinitionLanguage = (typeof SUPPORTED_DEFINITION_LANGUAGES)[number];

export type DefinitionSuccess = {
    definitions: string[];
    source: string;
};

export type DefinitionError = {
    error: 404 | 405;
    suggestion?: string;
};

export type DefinitionResult = DefinitionSuccess | DefinitionError;

/**
 * Socket.IO client for the external word-definition service (defs.opnm.net).
 * Uses the `def_sync` acknowledgement protocol so concurrent requests remain correlated.
 */
export default class BirdBotDefinitions {
    private static socket: Socket | null = null;
    private static readonly REQUEST_TIMEOUT_MS = 8000;

    public static isLanguageSupported(language: string): language is SupportedDefinitionLanguage {
        return (SUPPORTED_DEFINITION_LANGUAGES as readonly string[]).includes(language);
    }

    public static connect() {
        if (BirdBotDefinitions.socket) return;

        const socket = io(DEFS_SOCKET_URL, {
            reconnection: true,
            auth: { token: DEFS_AUTH_TOKEN },
        });
        BirdBotDefinitions.socket = socket;

        socket.on("connect", () => {
            Logger.log({
                message: "Connected to definitions server",
                path: "BirdBotDefinitions.class.ts",
            });
        });

        socket.on("disconnect", (reason) => {
            Logger.log({
                message: `Disconnected from definitions server: ${reason}`,
                path: "BirdBotDefinitions.class.ts",
            });
        });

        socket.on("connect_error", (err) => {
            Logger.error({
                message: `Definitions socket connect error: ${err.message}`,
                path: "BirdBotDefinitions.class.ts",
            });
        });
    }

    public static getDefinition(language: BirdBotLanguage, word: string): Promise<DefinitionResult> {
        BirdBotDefinitions.connect();

        if (!BirdBotDefinitions.isLanguageSupported(language)) {
            return Promise.resolve({ error: 405 });
        }

        const socket = BirdBotDefinitions.socket;
        if (!socket) {
            return Promise.resolve({ error: 404 });
        }

        return new Promise((resolve) => {
            let settled = false;
            const timeout = setTimeout(() => {
                settled = true;
                Logger.warn({
                    message: `Definitions request timed out for word=${word} lang=${language}`,
                    path: "BirdBotDefinitions.class.ts",
                });
                resolve({ error: 404 });
            }, BirdBotDefinitions.REQUEST_TIMEOUT_MS);

            socket.emit("def_sync", { word, lang: language }, (_word: string, typeOrSource: string, data: unknown) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);

                if (typeOrSource === "Error 404") {
                    resolve({
                        error: 404,
                        suggestion: typeof data === "string" && data.length > 0 ? data : undefined,
                    });
                    return;
                }
                if (typeOrSource === "Error 401") {
                    resolve({ error: 404 });
                    return;
                }

                resolve({
                    definitions: Array.isArray(data) ? data.map(String) : [],
                    source: String(typeOrSource),
                });
            });
        });
    }
}
