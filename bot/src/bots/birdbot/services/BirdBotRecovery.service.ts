import type { BirdBotRoomMetadata } from "../BirdBotTypes";

export type RecoveryMilestoneName = "round" | "seating";

export type RecoverySetupDecision =
    | { destroy: true }
    | {
          destroy: false;
          initializeMetadata: boolean;
          applyTargetRules: boolean;
          joinRound: boolean;
          backfillCurrentWords: boolean;
          playTurn: boolean;
          clearNextDelayMs: boolean;
      };

export function resolveRoundStartTimestamp(
    rawStartTimestamp: unknown,
    checkpointTimestamp: number,
    fallbackNow: number,
): number {
    if (typeof rawStartTimestamp === "number" && Number.isFinite(rawStartTimestamp)) {
        return rawStartTimestamp;
    }
    if (checkpointTimestamp > 0) {
        return checkpointTimestamp;
    }
    return fallbackNow;
}

export function shouldResetRoundState(
    checkpointMilestone: string | null | undefined,
    setupMilestone: string | null | undefined,
): boolean {
    if (!checkpointMilestone || !setupMilestone) return false;
    return checkpointMilestone !== setupMilestone;
}

export function isBotSeated(args: {
    milestoneName: RecoveryMilestoneName | null;
    myPeerId: number;
    playerPeerIds: Iterable<string | number>;
}): boolean {
    if (args.milestoneName !== "round") return false;
    const mine = String(args.myPeerId);
    for (const peerId of args.playerPeerIds) {
        if (String(peerId) === mine) return true;
    }
    return false;
}

export function decideRecoverySetup(input: {
    isFirstSetup: boolean;
    isRecoveryJoin: boolean;
    wasInitialized: boolean;
    isLeader: boolean;
    milestoneName: RecoveryMilestoneName | null;
    isSeated: boolean;
    isOwnTurn: boolean;
}): RecoverySetupDecision {
    if (!input.isLeader) {
        return { destroy: true };
    }

    const initializeMetadata = !input.wasInitialized;
    const isRejoin = input.isRecoveryJoin || !input.isFirstSetup;

    if (!isRejoin) {
        return {
            destroy: false,
            initializeMetadata,
            applyTargetRules: true,
            joinRound: true,
            backfillCurrentWords: false,
            playTurn: false,
            clearNextDelayMs: false,
        };
    }

    if (input.milestoneName === "seating") {
        return {
            destroy: false,
            initializeMetadata,
            applyTargetRules: false,
            joinRound: true,
            backfillCurrentWords: false,
            playTurn: false,
            clearNextDelayMs: false,
        };
    }

    if (input.milestoneName === "round") {
        const playTurn = input.isSeated && input.isOwnTurn;
        return {
            destroy: false,
            initializeMetadata,
            applyTargetRules: false,
            joinRound: !input.isSeated,
            backfillCurrentWords: input.isSeated,
            playTurn,
            clearNextDelayMs: playTurn,
        };
    }

    return {
        destroy: false,
        initializeMetadata,
        applyTargetRules: false,
        joinRound: false,
        backfillCurrentWords: false,
        playTurn: false,
        clearNextDelayMs: false,
    };
}

function remapKeyedString(key: string, fromPeerId: string, toPeerId: string): string {
    const prefix = `${fromPeerId}:`;
    if (key.startsWith(prefix)) return `${toPeerId}:${key.slice(prefix.length)}`;
    if (key === fromPeerId) return toPeerId;
    return key;
}

function remapSet(values: Set<string>, fromPeerId: string, toPeerId: string): void {
    const next = new Set<string>();
    for (const value of values) {
        next.add(remapKeyedString(value, fromPeerId, toPeerId));
    }
    values.clear();
    for (const value of next) values.add(value);
}

function remapMap<T>(values: Map<string, T>, fromPeerId: string, toPeerId: string): void {
    const next = new Map<string, T>();
    for (const [key, value] of values) {
        next.set(remapKeyedString(key, fromPeerId, toPeerId), value);
    }
    values.clear();
    for (const [key, value] of next) values.set(key, value);
}

export function remapPeerKeyedState(metadata: BirdBotRoomMetadata, fromPeerId: number, toPeerId: number): void {
    if (!Number.isFinite(fromPeerId) || !Number.isFinite(toPeerId)) return;
    if (fromPeerId === toPeerId || fromPeerId < 0 || toPeerId < 0) return;

    const from = String(fromPeerId);
    const to = String(toPeerId);
    const fromScores = metadata.scoresByPeerId[from];
    if (fromScores && metadata.scoresByPeerId[to] === undefined) {
        metadata.scoresByPeerId[to] = fromScores;
        delete metadata.scoresByPeerId[from];
    } else if (fromScores) {
        delete metadata.scoresByPeerId[from];
    }

    remapSet(metadata.greetedPeerIds, from, to);
    remapSet(metadata.flipTurnKeys, from, to);
    remapSet(metadata.scoredWordTurnKeys, from, to);
    remapMap(metadata.pendingWordRegistrations, from, to);
}

export async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const limit = Math.max(1, concurrency);
    const results = new Array<R>(items.length);
    let nextIndex = 0;

    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (true) {
            const index = nextIndex++;
            if (index >= items.length) return;
            results[index] = await fn(items[index]!, index);
        }
    });
    await Promise.all(workers);
    return results;
}

export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    delaysMs: number[],
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const delay = delaysMs[attempt];
            if (delay === undefined) break;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
