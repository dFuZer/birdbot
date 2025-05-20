import RecordsPage, { IScoreData } from "@/components/pages/RecordsPage/RecordsPage";
import { getFromApi } from "@/lib/fetching";
import { TSearchParams } from "@/lib/params";
import { ExperienceData, languageEnumSchema, modesEnumSchema, recordsEnumSchema } from "@/lib/records";
import { isValidGameModeParam, isValidLanguageParam, isValidRecordParam, tryGetNumberFromParam } from "@/lib/validation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Records",
    description: "View the best scores achieved by players against BirdBot.",
};

type IApiResponse = {
    message: string;
    bestScores: { player_id: string; player_username: string; score: number; rank: number; xp: ExperienceData }[];
};

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const params = await searchParams;
    const languageParamValue = params.l;
    const selectedLanguage = isValidLanguageParam(languageParamValue) ? languageParamValue : languageEnumSchema.Values.en;

    const modeParamValue = params.m;
    const selectedMode = isValidGameModeParam(modeParamValue) ? modeParamValue : modesEnumSchema.Values.regular;

    const recordParamValue = params.r;
    const selectedRecord = isValidRecordParam(recordParamValue) ? recordParamValue : recordsEnumSchema.Values.word;

    const selectedPage = tryGetNumberFromParam(params.page) || 1;
    const perPage = tryGetNumberFromParam(params.perPage) || 10;

    const data = await getFromApi(
        `/records?lang=${selectedLanguage}&mode=${selectedMode}&record=${selectedRecord}&page=${selectedPage}&perPage=${perPage}`,
    );

    const json: IApiResponse = await data.json();

    const finalData: IScoreData[] = json.bestScores.map((record) => {
        return {
            name: record.player_username,
            rank: record.rank,
            score: record.score,
            id: record.player_id,
            xp: record.xp,
        };
    });

    return <RecordsPage data={finalData} language={selectedLanguage} mode={selectedMode} record={selectedRecord} />;
}
