import Logger from "../../../lib/class/Logger.class";
import { API_KEY, API_URL } from "../BirdBotEnv";
import BirdBotParityApiService from "./BirdBotParityApi.service";

type QueueKind = "word" | "game-recap";

type QueueItem = {
    kind: QueueKind;
    path: string;
    body: unknown;
    idempotencyKey: string;
    attempts: number;
    nextAttemptAt: number;
};

const MAX_ATTEMPTS = 7;
const BASE_DELAY_MS = 500;

export default class BirdBotApiWriteQueue {
    private static readonly items: QueueItem[] = [];
    private static timer: NodeJS.Timeout | undefined;
    private static pumping = false;

    public static enqueueWord(body: Record<string, unknown> & { idempotencyKey: string }): void {
        this.enqueue({
            kind: "word",
            path: "/word",
            body,
            idempotencyKey: body.idempotencyKey,
        });
    }

    public static enqueueGameRecap(
        body: Record<string, unknown> & { idempotencyKey?: string },
        idempotencyKey: string,
    ): Promise<unknown | null> {
        return new Promise((resolve) => {
            const wrapped = {
                ...body,
                idempotencyKey,
            };
            this.enqueue({
                kind: "game-recap",
                path: "/game-recap",
                body: wrapped,
                idempotencyKey,
                onSettled: resolve,
            });
        });
    }

    private static enqueue(
        input: {
            kind: QueueKind;
            path: string;
            body: unknown;
            idempotencyKey: string;
            onSettled?: (value: unknown | null) => void;
        },
    ): void {
        if (this.items.some((item) => item.idempotencyKey === input.idempotencyKey)) {
            return;
        }
        const item: QueueItem & { onSettled?: (value: unknown | null) => void } = {
            kind: input.kind,
            path: input.path,
            body: input.body,
            idempotencyKey: input.idempotencyKey,
            attempts: 0,
            nextAttemptAt: Date.now(),
        };
        (item as any).onSettled = input.onSettled;
        this.items.push(item);
        this.ensurePump();
    }

    private static ensurePump(): void {
        if (this.timer) return;
        this.timer = setInterval(() => void this.pump(), 250);
        this.timer.unref?.();
    }

    private static async pump(): Promise<void> {
        if (this.pumping) return;
        this.pumping = true;
        try {
            const now = Date.now();
            const ready = this.items.filter((item) => item.nextAttemptAt <= now);
            for (const item of ready) {
                const settled = await this.trySend(item);
                if (settled) {
                    const idx = this.items.indexOf(item);
                    if (idx >= 0) this.items.splice(idx, 1);
                }
            }
            if (this.items.length === 0 && this.timer) {
                clearInterval(this.timer);
                this.timer = undefined;
            }
        } finally {
            this.pumping = false;
        }
    }

    private static async trySend(item: QueueItem & { onSettled?: (value: unknown | null) => void }): Promise<boolean> {
        item.attempts += 1;
        try {
            const response = await fetch(`${API_URL}${item.path}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${API_KEY}`,
                },
                body: JSON.stringify(item.body),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const json = response.status === 204 ? null : await response.json().catch(() => null);
            item.onSettled?.(json);
            return true;
        } catch (error) {
            Logger.error({
                message: `ApiWriteQueue ${item.kind} failed (attempt ${item.attempts}/${MAX_ATTEMPTS})`,
                path: "BirdBotApiWriteQueue.ts",
                error,
                json: { idempotencyKey: item.idempotencyKey },
            });
            if (item.attempts >= MAX_ATTEMPTS) {
                item.onSettled?.(null);
                return true;
            }
            item.nextAttemptAt = Date.now() + BASE_DELAY_MS * 2 ** (item.attempts - 1);
            return false;
        }
    }

    public static makeWordKey(gameId: string, turnKey: string, submitResult: string): string {
        return BirdBotParityApiService.makeIdempotencyKey(gameId, turnKey, submitResult, "word");
    }

    public static makeRecapKey(gameId: string, accountName: string): string {
        return BirdBotParityApiService.makeIdempotencyKey(gameId, accountName, "game-recap");
    }
}
