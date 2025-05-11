import PlayersPage, { PlayersPageData } from "@/components/pages/PlayersPage/PlayersPage";
import { getFromApi } from "@/lib/fetching";
import { TSearchParams } from "@/lib/params";
import { isValidPlayersPageSortParam, sortModeEnumSchema } from "@/lib/validation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Players",
    description: "View the most experienced players and their records.",
};

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const sortSearchParamValue = (await searchParams).sort;
    const sortMode = isValidPlayersPageSortParam(sortSearchParamValue) ? sortSearchParamValue : sortModeEnumSchema.Values.xp;

    const pageDataResponse = await getFromApi(`/leaderboard?mode=${sortMode}`);
    const json: PlayersPageData = await pageDataResponse.json();
    return <PlayersPage pageData={json} />;
}
