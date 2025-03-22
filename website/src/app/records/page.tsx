import RecordsPage from "@/components/pages/RecordsPage/RecordsPage";
import { isValidGameMode, isValidLanguage, isValidRecord } from "@/lib/searchParamUtils";
import { GameModesEnum, LanguagesEnum, RecordsEnum } from "@/records";
import { TSearchParams } from "@/types";

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const params = await searchParams;
    const languageParamValue = params.l;
    const selectedLanguage = isValidLanguage(languageParamValue) ? languageParamValue : LanguagesEnum.ENGLISH;

    const modeParamValue = params.m;
    const selectedMode = isValidGameMode(modeParamValue) ? modeParamValue : GameModesEnum.REGULAR;

    const recordParamValue = params.r;
    const selectedRecord = isValidRecord(recordParamValue) ? recordParamValue : RecordsEnum.WORDS;

    return <RecordsPage language={selectedLanguage} mode={selectedMode} record={selectedRecord} />;
}
