import PlayersPage, { IPlayersPageSortMode } from "@/components/pages/PlayersPage/PlayersPage";
import { ISearchParams } from "@/lib/utils";

function isValidPlayersPageSortParam(sortParam: any): sortParam is IPlayersPageSortMode {
    return sortParam === "experience" || sortParam === "records";
}

export default async function Page({ searchParams }: { searchParams: ISearchParams }) {
    const sortSearchParamValue = (await searchParams).sort;
    const sortMode = isValidPlayersPageSortParam(sortSearchParamValue) ? sortSearchParamValue : "experience";

    return <PlayersPage sortMode={sortMode} />;
}
