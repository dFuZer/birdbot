import RecordsPage, { IScoreData } from "@/components/pages/RecordsPage/RecordsPage";
import { isValidGameModeParam, isValidLanguageParam, isValidRecordParam, TSearchParams } from "@/lib/params";
import { GameModesEnum, LanguagesEnum, RecordsEnum } from "@/lib/records";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Records",
    description: "View the best scores achieved by players against BirdBot.",
};

const sampleRecordCardData: IScoreData = {
    name: "This name can be really long and it should be truncated",
    rank: 1,
    level: 12,
    score: 1000 * 60 * 60 * 2 + 1000 * 60 * 3 + 1000 * 45,
};

const recordSampleData: IScoreData[] = Array.from({ length: 10 })
    .map(() => sampleRecordCardData)
    .map((record, i) => {
        return { ...record, rank: i + 1, name: `${record.name} ${i + 1}` };
    });

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const params = await searchParams;
    const languageParamValue = params.l;
    const selectedLanguage = isValidLanguageParam(languageParamValue) ? languageParamValue : LanguagesEnum.ENGLISH;

    const modeParamValue = params.m;
    const selectedMode = isValidGameModeParam(modeParamValue) ? modeParamValue : GameModesEnum.REGULAR;

    const recordParamValue = params.r;
    const selectedRecord = isValidRecordParam(recordParamValue) ? recordParamValue : RecordsEnum.WORDS;

    return <RecordsPage data={recordSampleData} language={selectedLanguage} mode={selectedMode} record={selectedRecord} />;
}
