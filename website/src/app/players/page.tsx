import PlayersPage, { TPlayersPageSortMode } from "@/components/pages/PlayersPage/PlayersPage";
import { TSearchParams } from "@/lib/utils";

function isValidPlayersPageSortParam(sortParam: string | string[] | undefined): sortParam is TPlayersPageSortMode {
    return sortParam === "experience" || sortParam === "records";
}

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const sortSearchParamValue = (await searchParams).sort;
    const sortMode = isValidPlayersPageSortParam(sortSearchParamValue) ? sortSearchParamValue : "experience";

    return <PlayersPage sortMode={sortMode} />;
}
