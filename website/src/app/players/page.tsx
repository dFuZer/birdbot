import PlayersPage from "@/components/pages/PlayersPage/PlayersPage";
import { isValidPlayersPageSortParam } from "@/lib/searchParamUtils";
import { TSearchParams } from "@/types";

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const sortSearchParamValue = (await searchParams).sort;
    const sortMode = isValidPlayersPageSortParam(sortSearchParamValue) ? sortSearchParamValue : "experience";

    return <PlayersPage sortMode={sortMode} />;
}
