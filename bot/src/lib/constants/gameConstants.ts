import type { BombPartyRules, DictionaryId, DictionaryManifest } from "../types/gameTypes";
export const baseMessageKinds = ["bye"] as const;
export const centralMessageKinds = [
    ...baseMessageKinds,
    "hello",
    "hello.ok",
    "restartCentral",
    "restartNode",
    "matchFound",
    "roomReady",
    "queueUpdate",
    "getGamerIdentity",
    "getGamerIdentity.result",
    "createRoom",
    "createRoom.ok",
    "closeRoom",
    "submitGameOutcome",
    "submitGameOutcome.result",
    "setRoomOnlineGamerCount",
    "setRoomAccessMode",
    "setRoomHost",
    "setRoomTags",
    "chatMessages",
    "stats",
    "updateNode",
    "scheduleNodeRestart",
    "announce",
    "announceRestart",
    "accounts",
    "updateAccount",
    "setAccountStatus",
    "setAccountNotes",
    "setAccountPlatformRole",
    "setAccountContentRole",
    "ipBans",
    "setIpRangeBanned",
    "setIpRangeBanned.result",
    "sightings",
] as const;
export const nodeMessageKinds = [
    ...baseMessageKinds,
    "hello",
    "hello.ok",
    "setRoomAccessMode",
    "setRole",
    "addGamer",
    "setGamerOnline",
    "getGamerModerationInfo",
    "getGamerModerationInfo.result",
    "chat",
    "chatRateLimited",
    "announce",
    "announceRestart",
    "session",
] as const;

export const bombpartySessionMessageKinds = [
    "debug",
    "setup",
    "toggleCountdown",
    "start",
    "abort",
    "type",
    "submit",
    "addPlayer",
    "removePlayer",
    "1v1Announcement",
    "roundIntro",
    "round",
    "roundOver",
    "gameOver",
    "updatePlaylistRatings",
    "explodeBomb",
    "nextTurn",
] as const;

export const gameModes = ["party", "survival", "solo"] as const;
export const hostRoomAccessModes = ["public", "private", "locked"] as const;
export const gameIds = ["bombParty", "popSauce", "masterOfTheGrid", "cavernFrenzy"] as const;
export const queueTypes = ["quickPlay", "hostRoom", "ranked1v1", "soloChallenge"] as const;
export const centralSocketTypes = ["node", "queuer", "watcher", "admin"] as const;
export const dictionaryIds = ["en", "fr", "de", "it", "es", "pt-BR", "eu", "br"] as const;
export const roomRoles = ["", "host", "moderator", "banned"] as const;

export const dictionaryManifests: Record<DictionaryId, DictionaryManifest> = {
    "fr": {
        bonusLetters: "abcdefghijklmnopqrstuvxyz",
        difficultyPresets: {
            beginner: 500,
            medium: 300,
            hard: 100,
        },
    },
    "br": {
        bonusLetters: "abcdefghijklmnopqrstuvxyz",
        difficultyPresets: {
            beginner: 500,
            medium: 300,
            hard: 100,
        },
    },
    "en": {
        bonusLetters: "abcdefghijklmnopqrstuvwy",
        difficultyPresets: {
            beginner: 500,
            medium: 300,
            hard: 100,
        },
    },
    "de": {
        bonusLetters: "abcdefghijklmnopqrstuvwy",
        difficultyPresets: {
            beginner: 500,
            medium: 300,
            hard: 100,
        },
    },
    "pt-BR": {
        bonusLetters: "abcdefghijlmnopqrstuvxz",
        difficultyPresets: {
            beginner: 500,
            medium: 300,
            hard: 100,
        },
    },
    "es": {
        bonusLetters: "abcdefghijlmnopqrstuvxyz",
        difficultyPresets: {
            beginner: 500,
            medium: 300,
            hard: 100,
        },
    },
    "it": {
        bonusLetters: "abcdefghilmnopqrstuz",
        difficultyPresets: {
            beginner: 500,
            medium: 300,
            hard: 100,
        },
    },
    "eu": {
        bonusLetters: "abdefghijklmnoprstuxz",
        difficultyPresets: {
            beginner: 500,
            medium: 300,
            hard: 100,
        },
    },
};

export const defaultBombPartyRules: BombPartyRules = {
    gameMode: "party",
    dictionaryId: "en",
    promptDifficulty: "beginner",
    bombDuration: 6,
    customPromptDifficulty: 50,
    roundsToWin: 3,
    minWordLengthOption: "0",
    scoreGoal: 100,
    startingLives: 2,
    maxLives: 3,
};

export const roundsToWinRange = {
    min: 1,
    max: 7,
} as const;
export const scoreGoalRange = {
    min: 100,
    max: 1e3,
    step: 50,
} as const;
export const livesRange = {
    min: 1,
    max: 10,
} as const;
export const alphabet = "abcdefghijklmnopqrstuvwxyz" as const;
export const minWordLengthOptions = ["0", "auto8", "auto16", "3", "4", "5", "6", "7", "8"] as const;
export const bombDurationRange = {
    min: 3,
    max: 10,
} as const;

export const promptDifficulties = ["beginner", "medium", "hard", "custom"] as const;
export const customPromptDifficultyRange = {
    min: -5e3,
    max: 5e3,
} as const;
export const submitResults = [
    "success",
    "failsPrompt",
    "invalidWord",
    "noText",
    "alreadyUsed",
    "bombExploded",
] as const;
export const resultPoints = {
    success: 5,
    failsPrompt: -5,
    invalidWord: 0,
    noText: 0,
    alreadyUsed: -1,
    bombExploded: -10,
} as const;
