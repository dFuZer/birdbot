import { dictionaryIds, failWordReasons, promptDifficulties, submitResults } from "../constants/gameConstants";

export type DictionaryId = (typeof dictionaryIds)[number];
export type PromptDifficulty = (typeof promptDifficulties)[number];
export type SubmitResultType = (typeof submitResults)[number];
export type FailWordReason = (typeof failWordReasons)[number] | string;

export type JklmAuth = {
    expiration: number;
    service: string;
    token: string;
    username: string;
    id?: string;
} | null;

export type ChatterProfile = {
    peerId: number;
    nickname: string;
    auth: JklmAuth;
    roles?: string[];
    picture?: string | null;
};

/** Room participant (chat-side identity). */
export type Chatter = {
    peerId: number;
    nickname: string;
    /** jklm auth.id when logged in; null for guests */
    authId: string | null;
    isOnline: boolean;
    isModerator: boolean;
    isBanned?: boolean;
};

export type DictionaryManifest = {
    name?: string;
    bonusLetters: string;
    promptDifficulties?: {
        beginner: number;
        medium: number;
        hard: number;
    };
};

/** jklm `customBonusAlphabet` rule: letter → enabled count (0 = disabled). */
export type CustomBonusAlphabet = Record<string, number>;

export type BombPartyRules = {
    dictionaryId: DictionaryId;
    minTurnDuration: number;
    promptDifficulty: PromptDifficulty;
    customPromptDifficulty: number;
    maxPromptAge: number;
    startingLives: number;
    maxLives: number;
    customBonusAlphabet: CustomBonusAlphabet;
};

export type DictionaryLessGameRules = Omit<BombPartyRules, "dictionaryId" | "customBonusAlphabet">;
export type GameRules = BombPartyRules;
export type BombPartyRuleKey = keyof BombPartyRules;

export type PlayerState = {
    peerId: number;
    lives: number;
    /** Canonical lowercase word used by game logic. */
    word: string;
    /** Unmodified value received from JKLM. */
    rawWord: string;
    /** Letters collected toward bonus alphabet this life */
    usedLetters: string;
    /** Authoritative JKLM progress toward the bonus alphabet. */
    bonusLetters: string;
    wasWordValidated?: boolean;
    startTurn: number | null;
    startWrite: number | null;
};

export type MilestoneSeating = {
    name: "seating";
    rulesLocked?: boolean;
    dictionaryManifest?: DictionaryManifest;
};

export type MilestoneRound = {
    name: "round";
    syllable: string;
    promptAge?: number;
    currentPlayerPeerId: number;
    playerStatesByPeerId: Record<string, PlayerState>;
    dictionaryManifest?: DictionaryManifest;
    startTimestamp: number;
};

export type Milestone = MilestoneSeating | MilestoneRound;

export type RoomPlayer = {
    profile: ChatterProfile;
    isOnline: boolean;
};

export type RoomData = {
    code: string;
    isPublic: boolean;
    chatters: Chatter[];
    playerCount?: number;
    bannedPeerIds?: number[];
};

export type GameData = {
    rules: GameRules;
    dictionaryManifest: DictionaryManifest;
    milestone: Milestone;
    players: RoomPlayer[];
    leaderPeerId: number;
    selfRoles: string[];
};

export function bonusAlphabetToLetters(bonusAlphabet: Record<string, number> | string | undefined): string {
    if (!bonusAlphabet) return "";
    if (typeof bonusAlphabet === "string") return bonusAlphabet;
    return Object.entries(bonusAlphabet)
        .filter(([, count]) => count > 0)
        .map(([letter]) => letter)
        .join("");
}

export function normalizeWord(rawWord: unknown): string {
    return String(rawWord ?? "")
        .toLowerCase()
        .replace(/[^a-z'-]/g, "");
}

/** Setup sends rule descriptors; `setRules` sends already-unwrapped values. */
export function extractSetupRulesValues(rawRules: Record<string, unknown>): Partial<GameRules> & Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(rawRules)) {
        if (entry && typeof entry === "object" && "value" in entry) {
            out[key] = (entry as { value: unknown }).value;
        }
    }
    return out;
}

export function extractIncrementalRulesValues(rawRules: Record<string, unknown>): Partial<GameRules> & Record<string, unknown> {
    return { ...rawRules };
}
