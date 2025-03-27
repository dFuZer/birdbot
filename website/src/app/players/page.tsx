import PlayersPage, { IPlayerCardDataExperience, IPlayerCardDataRecords } from "@/components/pages/PlayersPage/PlayersPage";
import { TSearchParams } from "@/lib/params";
import { isValidPlayersPageSortParam, sortModeEnumSchema } from "@/lib/validation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Players",
    description: "View the most experienced players and their records.",
};

const samplePlayerCardDataExperience: IPlayerCardDataExperience = {
    experience: 100,
    name: "Player Name",
    avatarUrl: "https://avatars.githubusercontent.com/u/1",
    level: 1,
    rank: 1,
    experienceNeededForNextLevel: 500,
};
const samplePlayersDataExperience: IPlayerCardDataExperience[] = Array.from({ length: 10 }, (_, i) => ({
    ...samplePlayerCardDataExperience,
    name: `This name can be really long and it should be truncated ${i + 1}`,
    rank: i + 1,
}));
const samplePageDataExperience = {
    sortMode: sortModeEnumSchema.Values.experience,
    data: samplePlayersDataExperience,
};

const samplePlayerCardDataRecords: IPlayerCardDataRecords = {
    name: "",
    avatarUrl: "https://avatars.githubusercontent.com/u/1",
    level: 1,
    rank: 1,
    recordsCount: 100,
};
const samplePlayersDataRecords: IPlayerCardDataRecords[] = Array.from({ length: 10 }, (_, i) => ({
    ...samplePlayerCardDataRecords,
    name: `This name can be really long and it should be truncated ${i + 1}`,
    rank: i + 1,
}));
const samplePageDataRecords = {
    sortMode: sortModeEnumSchema.Values.records,
    data: samplePlayersDataRecords,
};

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const sortSearchParamValue = (await searchParams).sort;
    const sortMode = isValidPlayersPageSortParam(sortSearchParamValue)
        ? sortSearchParamValue
        : sortModeEnumSchema.Values.experience;

    const pageData = sortMode === sortModeEnumSchema.Values.experience ? samplePageDataExperience : samplePageDataRecords;

    return <PlayersPage pageData={pageData} />;
}
