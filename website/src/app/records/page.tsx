import RecordsPage from "@/components/pages/RecordsPage/RecordsPage";
import { TSearchParams } from "@/types";
import { isValidLanguage, isValidPlayersPageSortParam } from "@/lib/searchParamUtils";
import { LanguagesEnum } from "@/records";

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const searchParamsAwaited = await searchParams;
    const languageModeParamValue = searchParamsAwaited.language;
    const languageMode = isValidLanguage(languageModeParamValue) ? languageModeParamValue : LanguagesEnum.ENGLISH;

    return <RecordsPage />;
}
