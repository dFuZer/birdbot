import PlayersPage, { IPlayerCardDataExperience, IPlayerCardDataRecords } from "@/components/pages/PlayersPage/PlayersPage";
import { isValidPlayersPageSortParam } from "@/lib/searchParamUtils";
import { PlayersPageSortModeEnum, TSearchParams } from "@/types";

const samplePlayerCardDataExperience: IPlayerCardDataExperience = {
    experience: 100,
    name: "John Doe",
    avatarUrl: "https://avatars.githubusercontent.com/u/1",
    level: 1,
    rank: 1,
    experienceNeededForNextLevel: 500,
};
const samplePlayersDataExperience: IPlayerCardDataExperience[] = Array.from({ length: 10 }, (_, i) => ({
    ...samplePlayerCardDataExperience,
    name: `${samplePlayerCardDataExperience.name} ${i + 1}`,
    rank: i + 1,
}));
const samplePageDataExperience = {
    sortMode: PlayersPageSortModeEnum.Experience as PlayersPageSortModeEnum.Experience,
    data: samplePlayersDataExperience,
};

const samplePlayerCardDataRecords: IPlayerCardDataRecords = {
    name: "John Doe",
    avatarUrl: "https://avatars.githubusercontent.com/u/1",
    level: 1,
    rank: 1,
    recordsCount: 100,
};
const samplePlayersDataRecords: IPlayerCardDataRecords[] = Array.from({ length: 10 }, (_, i) => ({
    ...samplePlayerCardDataRecords,
    name: `${samplePlayerCardDataRecords.name} ${i + 1}`,
    rank: i + 1,
}));
const samplePageDataRecords = {
    sortMode: PlayersPageSortModeEnum.Records as PlayersPageSortModeEnum.Records,
    data: samplePlayersDataRecords,
};

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const sortSearchParamValue = (await searchParams).sort;
    const sortMode = isValidPlayersPageSortParam(sortSearchParamValue)
        ? sortSearchParamValue
        : PlayersPageSortModeEnum.Experience;

    const pageData = sortMode === PlayersPageSortModeEnum.Experience ? samplePageDataExperience : samplePageDataRecords;

    return <PlayersPage pageData={pageData} />;
}
