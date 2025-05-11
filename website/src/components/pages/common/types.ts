import { ExperienceData } from "@/lib/records";

export type IPlayerScoreCommonProps = {
    id: string;
    avatarUrl?: string;
    name: string;
    xp: ExperienceData;
    rank: number;
};
