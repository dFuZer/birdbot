import RecordsPage from "@/components/pages/RecordsPage/RecordsPage";
import { TSearchParams } from "@/types";
import { isValidGameMode, isValidLanguage, isValidRecord } from "@/lib/searchParamUtils";
import { GameModesEnum, LanguagesEnum, RecordsEnum } from "@/records";

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const params = await searchParams;
    const languageParamValue = params.language;
    const selectedLanguage = isValidLanguage(languageParamValue) ? languageParamValue : LanguagesEnum.ENGLISH;

    const modeParamValue = params.mode;
    const selectedMode = isValidGameMode(modeParamValue) ? modeParamValue : GameModesEnum.REGULAR;

    const recordParamValue = params.record;
    const selectedRecord = isValidRecord(recordParamValue) ? recordParamValue : RecordsEnum.WORDS;

    return <RecordsPage />;
}
