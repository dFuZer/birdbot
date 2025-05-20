import { IPlayerScoreCommonProps } from "@/components/pages/common/types";
import PlayersPage from "@/components/pages/PlayersPage/PlayersPage";
import { getFromApi } from "@/lib/fetching";
import { TSearchParams } from "@/lib/params";
import { isValidPlayersPageSortParam, sortModeEnumSchema, tryGetNumberFromParam } from "@/lib/validation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Players",
    description: "View the most experienced players and their records.",
};

export interface IPlayerCardDataRecords extends IPlayerScoreCommonProps {
    recordsCount: number;
}

export interface IPlayerCardDataPP extends IPlayerScoreCommonProps {
    pp: number;
}

export type PlayersPageData = { maxPage: number } & (
    | {
          mode: "xp";
          data: IPlayerScoreCommonProps[];
      }
    | {
          mode: "records";
          data: IPlayerCardDataRecords[];
      }
    | {
          mode: "pp";
          data: IPlayerCardDataPP[];
      }
);

export default async function Page({ searchParams: searchParamsPromise }: { searchParams: TSearchParams }) {
    const searchParams = await searchParamsPromise;
    const sortSearchParamValue = searchParams.sort;
    const pageSearchParamValue = searchParams.page;
    const sortMode = isValidPlayersPageSortParam(sortSearchParamValue) ? sortSearchParamValue : sortModeEnumSchema.Values.pp;
    const page = tryGetNumberFromParam(pageSearchParamValue) ?? 1;
    const pageDataResponse = await getFromApi(`/leaderboard?mode=${sortMode}&page=${page}&perPage=${10}`);
    const json: PlayersPageData = await pageDataResponse.json();

    return <PlayersPage pageData={json} isFirstPage={page === 1} />;
}
