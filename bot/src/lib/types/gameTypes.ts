import {
    bombpartySessionMessageKinds,
    centralMessageKinds,
    defaultBombPartyRules,
    dictionaryIds,
    gameModes,
    minWordLengthOptions,
    nodeMessageKinds,
    promptDifficulties,
    roomRoles,
    submitResults,
} from "../constants/gameConstants";

export interface AvatarPart {
    partName: string;
    variantName: string | null;
}

export interface Avatar {
    head?: AvatarPart;
    eyes?: AvatarPart;
    body?: AvatarPart;
    top?: AvatarPart;
    bottom?: AvatarPart;
    eyewear?: AvatarPart;
    gloves?: AvatarPart;
    hat?: AvatarPart;
    neckwear?: AvatarPart;
}

export interface Roles {
    supporter: string | null;
    content: string | null;
    platform: string | null;
}

export interface GameStats {
    bombParty: {
        gamesPlayed: number;
        playTime: number;
        achievements: string[];
    };
}

export interface Identity {
    name: string | null;
    nickname: string;
    signUpTimestamp: number;
    awards: string[];
    picture: string | null;
    avatar: Avatar;
    roles: Roles;
    gameStats: GameStats;
}

export interface PlaylistRating {
    start: number;
    end: number;
}

export interface Gamer {
    id: number;
    identity: Identity;
    role: RoomRole;
    isOnline: boolean;
    roundsWon: number;
    playlistRating: PlaylistRating;
}

export type RoomAccessMode = "public" | "private" | "locked" | "playlist";
export type PlaylistType = "quickPlay" | "ranked1v1";
export type DictionaryId = (typeof dictionaryIds)[number];
export type PromptDifficulty = (typeof promptDifficulties)[number];
export type MinWordLengthOption = (typeof minWordLengthOptions)[number];

export interface RoomData {
    code: string;
    gamers: Gamer[];
    access: {
        mode: RoomAccessMode;
        dictionaryId: DictionaryId;
        host: Identity;
        playlistType: PlaylistType;
    };
}

export interface GameRules {
    gameMode: GameMode;
    dictionaryId: DictionaryId;
    promptDifficulty: PromptDifficulty;
    bombDuration: number;
    customPromptDifficulty: number;
    roundsToWin: number;
    minWordLengthOption: MinWordLengthOption;
    scoreGoal: number;
    startingLives: number;
    maxLives: number;
}

export type DictionaryLessGameRules = Omit<GameRules, "dictionaryId">;

export interface GameStep {
    value: "pregame" | "initialSetup" | "1v1Announcement" | "round" | "matchOver" | "roundIntro" | "roundOver";
    timestamp: number;
}

export interface DictionaryManifest {
    bonusLetters: string;
    difficultyPresets: {
        beginner: number;
        medium: number;
        hard: number;
    };
}

export interface RoundState {
    value: string;
    timestamp: number;
}

export interface Round {
    index: number;
    startPlayerIndex: number;
    turnIndex: number;
    state: RoundState;
    prompt: string;
    promptAge: number;
    minWordLength: number;
    startTimestamp: number;
    wordsPlayed: number;
}

export interface Countdown {
    enabled: boolean;
    timestamp: number | null;
}

export interface Game {
    duration: number;
    wordsPlayed: number;
}

export interface Player {
    gamerId: number;
    justExploded: boolean;
    lives: number;
    points: number;
    usedLetters: string;
    text: string;
    lastPrompt: string;
    lastSubmit: {
        timestamp: number;
        result: SubmitResultType;
        points: number;
    } | null;
    isLongOffline: boolean;
}

export interface GameData {
    rules: GameRules;
    step: GameStep;
    dictionaryManifest: DictionaryManifest;
    players: Player[];
    countdown: Countdown;
    game: Game;
    round: Round;
    lastRoundWinnerId: number | null;
}

export type NodeMessageKind = (typeof nodeMessageKinds)[number];
export type BombpartySessionMessageKind = (typeof bombpartySessionMessageKinds)[number];
export type CentralMessageKind = (typeof centralMessageKinds)[number];
export type RoomRole = (typeof roomRoles)[number];
export type SubmitResultType = (typeof submitResults)[number];
export type BombPartyRuleKey = keyof typeof defaultBombPartyRules;
export type AnyMessageKind = NodeMessageKind | BombpartySessionMessageKind | CentralMessageKind;
export type GameMode = (typeof gameModes)[number];
export type BombPartyRules = {
    gameMode: GameMode;
    dictionaryId: DictionaryId;
    promptDifficulty: PromptDifficulty;
    bombDuration: number;
    customPromptDifficulty: number;
    roundsToWin: number;
    minWordLengthOption: MinWordLengthOption;
    scoreGoal: number;
    startingLives: number;
    maxLives: number;
};
