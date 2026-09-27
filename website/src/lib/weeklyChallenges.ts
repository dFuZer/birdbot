import { ExperienceData, LanguageEnum } from "@/lib/records";

export const CURRENT_WEEKLY_CHALLENGE_PARAM = "current";
export const CURRENT_WEEKLY_CHALLENGE_HREF = `/records?cotw=${CURRENT_WEEKLY_CHALLENGE_PARAM}`;

export type WeeklyChallengeKind =
    | "THIRTY_OF_A_LETTER"
    | "PROMPT_MEMORY_SPRINT"
    | "ALPHA_SPRINT"
    | "FIVEFOLD_ALPHABET"
    | "BLITZ_SURVIVAL"
    | "SUB50_SURVIVAL"
    | "SUB500_LIFE_GAIN";

export type WeeklyChallengeRankingKey = { metric: "elapsed_ms" | "words" | "flips"; order: "asc" | "desc" };

export interface IWeeklyChallengePeriod {
    id: string;
    sequence: number;
    kind: WeeklyChallengeKind;
    startsAt: number;
    endsAt: number;
    configVersion: number;
    config: {
        ranking: { primary: WeeklyChallengeRankingKey; secondary: WeeklyChallengeRankingKey | null };
        languages: Record<LanguageEnum, { targetLetter: string | null }>;
    };
}

export interface IWeeklyChallengeLeaderboardEntry {
    rank: number;
    playerId: string;
    authId: string;
    username: string | null;
    xp: ExperienceData;
    avatarUrl?: string;
    primaryValue: number;
    secondaryValue: number | null;
}

export interface IWeeklyChallengeLeaderboard {
    period: IWeeklyChallengePeriod;
    language: LanguageEnum;
    total: number;
    page: number;
    perPage: number;
    entries: IWeeklyChallengeLeaderboardEntry[];
}

export const WEEKLY_CHALLENGE_NAMES: Record<WeeklyChallengeKind, string> = {
    THIRTY_OF_A_LETTER: "Thirty of a Letter",
    PROMPT_MEMORY_SPRINT: "Prompt Memory Sprint",
    ALPHA_SPRINT: "Alpha Sprint",
    FIVEFOLD_ALPHABET: "Fivefold Alphabet",
    BLITZ_SURVIVAL: "Blitz Survival",
    SUB50_SURVIVAL: "Sub-50 Survival",
    SUB500_LIFE_GAIN: "Sub-500 Life Gain",
};

export function getWeeklyChallengeObjective(period: IWeeklyChallengePeriod, language: LanguageEnum): string {
    switch (period.kind) {
        case "THIRTY_OF_A_LETTER": {
            const letter = period.config.languages[language]?.targetLetter?.toUpperCase() ?? "?";
            return `Place 30 copies of the letter ${letter} as fast as possible.`;
        }
        case "PROMPT_MEMORY_SPRINT":
            return "Play one word reaching Prompt Memory 5 as fast as possible, with 3-second turns.";
        case "ALPHA_SPRINT":
            return "Score 5 alpha points as fast as possible, with every letter required twice.";
        case "FIVEFOLD_ALPHABET":
            return "Complete an alphabet needing every letter five times, using as few words as possible.";
        case "BLITZ_SURVIVAL":
            return "Survive for as many words as possible under Blitz rules.";
        case "SUB50_SURVIVAL":
            return "Survive for as many words as possible under Sub-50 rules.";
        case "SUB500_LIFE_GAIN":
            return "Complete as many bonus alphabets as possible under Sub-500 rules.";
    }
}

export function getUtcDateDisplay(timestamp: number): string {
    return new Date(timestamp).toISOString().slice(0, 10);
}

export function getWeekOptionLabel(period: IWeeklyChallengePeriod, now: number): string {
    const isCurrent = period.startsAt <= now && now < period.endsAt;
    return `${WEEKLY_CHALLENGE_NAMES[period.kind]} · ${getUtcDateDisplay(period.startsAt)}${isCurrent ? " (current)" : ""}`;
}

export function getPreciseTimeDisplay(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60_000);
    const seconds = Math.floor((milliseconds % 60_000) / 1000);
    const ms = milliseconds % 1000;
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}
