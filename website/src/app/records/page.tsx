import RecordsPage, { IScoreData } from "@/components/pages/RecordsPage/RecordsPage";
import { isValidGameMode, isValidLanguage, isValidRecord } from "@/lib/searchParamUtils";
import { GameModesEnum, LanguagesEnum, RecordsEnum } from "@/records";
import { TSearchParams } from "@/types";

const sampleRecordCardData: IScoreData = {
    name: "dFuZer",
    rank: 1,
    level: 12,
    score: 45,
};

const recordSampleData: IScoreData[] = Array.from({ length: 10 })
    .map(() => sampleRecordCardData)
    .map((record, i) => {
        return { ...record, rank: i + 1, name: `${record.name} ${i + 1}` };
    });

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const params = await searchParams;
    const languageParamValue = params.l;
    const selectedLanguage = isValidLanguage(languageParamValue) ? languageParamValue : LanguagesEnum.ENGLISH;

    const modeParamValue = params.m;
    const selectedMode = isValidGameMode(modeParamValue) ? modeParamValue : GameModesEnum.REGULAR;

    const recordParamValue = params.r;
    const selectedRecord = isValidRecord(recordParamValue) ? recordParamValue : RecordsEnum.WORDS;

    return <RecordsPage data={recordSampleData} language={selectedLanguage} mode={selectedMode} record={selectedRecord} />;
}
