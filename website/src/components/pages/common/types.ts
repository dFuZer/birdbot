import { ExperienceData } from "@/lib/records";

export type IPlayerScoreCommonProps = {
    id: string;
    avatarUrl?: string;
    accountName: string;
    name: string;
    xp: ExperienceData;
    rank: number;
};
