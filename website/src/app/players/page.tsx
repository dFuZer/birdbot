import PlayersPage from "@/components/pages/PlayersPage/PlayersPage";
import { TPlayersPageSortMode, TSearchParams } from "@/types";

function isValidPlayersPageSortParam(sortParam: string | string[] | undefined): sortParam is TPlayersPageSortMode {
    return sortParam === "experience" || sortParam === "records";
}

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const sortSearchParamValue = (await searchParams).sort;
    const sortMode = isValidPlayersPageSortParam(sortSearchParamValue) ? sortSearchParamValue : "experience";

    return <PlayersPage sortMode={sortMode} />;
}
