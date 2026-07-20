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

export type BombPartyRules = {
    dictionaryId: DictionaryId;
    minTurnDuration: number;
    promptDifficulty: PromptDifficulty;
    customPromptDifficulty: number;
    maxPromptAge: number;
    startingLives: number;
    maxLives: number;
};

export type DictionaryLessGameRules = Omit<BombPartyRules, "dictionaryId">;
export type GameRules = BombPartyRules;
export type BombPartyRuleKey = keyof BombPartyRules;

export type PlayerState = {
    peerId: number;
    lives: number;
    word: string;
    /** Letters collected toward bonus alphabet this life */
    usedLetters: string;
    bonusLetters?: Record<string, number> | string;
    wasWordValidated?: boolean;
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
};

export type GameData = {
    rules: GameRules;
    dictionaryManifest: DictionaryManifest;
    milestone: Milestone;
    players: RoomPlayer[];
    leaderPeerId: number;
    selfRoles: string[];
};

/** @deprecated alias kept for gradual product remaps — use Chatter */
export type Gamer = Chatter & { id: number; identity: { name: string | null; nickname: string }; role: string };

export function bonusAlphabetToLetters(bonusAlphabet: Record<string, number> | string | undefined): string {
    if (!bonusAlphabet) return "";
    if (typeof bonusAlphabet === "string") return bonusAlphabet;
    return Object.entries(bonusAlphabet)
        .filter(([, count]) => count > 0)
        .map(([letter]) => letter)
        .join("");
}

export function extractRulesValues(rawRules: Record<string, { value: unknown }>): Partial<GameRules> & Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(rawRules)) {
        if (entry && typeof entry === "object" && "value" in entry) {
            out[key] = entry.value;
        }
    }
    return out;
}
