import RecordsPage, { IScoreData } from "@/components/pages/RecordsPage/RecordsPage";
import WeeklyChallengeRecordsPage from "@/components/pages/RecordsPage/WeeklyChallengeRecordsPage";
import { getFromApi } from "@/lib/fetching";
import { TSearchParams } from "@/lib/params";
import { languageEnumSchema, modesEnumSchema, recordsEnumSchema, type LanguageEnum } from "@/lib/records";
import { isValidGameModeParam, isValidLanguageParam, isValidRecordParam, tryGetNumberFromParam } from "@/lib/validation";
import {
    CURRENT_WEEKLY_CHALLENGE_PARAM,
    getWeekOptionLabel,
    type IWeeklyChallengeLeaderboard,
    type IWeeklyChallengePeriod,
} from "@/lib/weeklyChallenges";
import { Metadata } from "next";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = {
    title: "Records",
    description: "View the best scores achieved by players against BirdBot.",
};

type IApiResponse = {
    message: string;
    bestScores: IScoreData[];
    maxPage: number;
};

async function getJsonFromApi<T>(url: string): Promise<T | null> {
    try {
        const response = await getFromApi(url);
        return response.ok ? ((await response.json()) as T) : null;
    } catch {
        return null;
    }
}

async function WeeklyChallengeView({
    cotw,
    language,
    page,
    perPage,
}: {
    cotw: string;
    language: LanguageEnum;
    page: number;
    perPage: number;
}) {
    const [periodsResponse, currentResponse] = await Promise.all([
        getJsonFromApi<{ periods: IWeeklyChallengePeriod[] }>(`/weekly-challenges?perPage=100`),
        cotw === CURRENT_WEEKLY_CHALLENGE_PARAM
            ? getJsonFromApi<{ current: IWeeklyChallengePeriod }>(`/weekly-challenges/current`)
            : Promise.resolve(null),
    ]);
    const periodId = cotw === CURRENT_WEEKLY_CHALLENGE_PARAM ? currentResponse?.current.id : cotw;
    const leaderboard = periodId
        ? await getJsonFromApi<IWeeklyChallengeLeaderboard>(
              `/weekly-challenges/${encodeURIComponent(periodId)}/leaderboard?lang=${language}&page=${page}&perPage=${perPage}`,
          )
        : null;

    const now = Date.now();
    const weekOptions = (periodsResponse?.periods ?? []).map((period) => ({
        id: period.id,
        label: getWeekOptionLabel(period, now),
    }));

    return (
        <WeeklyChallengeRecordsPage
            language={language}
            leaderboard={leaderboard}
            weekOptions={weekOptions}
            maxPage={leaderboard ? Math.ceil(leaderboard.total / perPage) : 0}
            isFirstPage={page === 1}
        />
    );
}

export default async function Page({ searchParams }: { searchParams: TSearchParams }) {
    const params = await searchParams;
    const languageParamValue = params.l;
    const selectedLanguage = isValidLanguageParam(languageParamValue) ? languageParamValue : languageEnumSchema.Values.en;

    if (typeof params.cotw === "string") {
        const cotw = UUID_REGEX.test(params.cotw) ? params.cotw : CURRENT_WEEKLY_CHALLENGE_PARAM;
        return (
            <WeeklyChallengeView
                cotw={cotw}
                language={selectedLanguage}
                page={Math.max(1, Math.floor(tryGetNumberFromParam(params.page) || 1))}
                perPage={Math.min(100, Math.max(1, Math.floor(tryGetNumberFromParam(params.perPage) || 10)))}
            />
        );
    }

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

    return (
        <RecordsPage
            data={json.bestScores}
            language={selectedLanguage}
            mode={selectedMode}
            record={selectedRecord}
            maxPage={json.maxPage}
            isFirstPage={selectedPage === 1}
        />
    );
}
