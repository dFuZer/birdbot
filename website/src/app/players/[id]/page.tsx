import PlayerProfilePage from "@/components/pages/PlayersPage/PlayerProfilePage";
import { getFromApi } from "@/lib/fetching";
import { TSearchParams } from "@/lib/params";
import { ExperienceData, LanguageEnum, ModesEnum, RecordsEnum } from "@/lib/records";
import { isValidGameModeParam, isValidLanguageParam } from "@/lib/validation";

export interface IPlayerProfileData {
    foundUsername: string;
    playerId: string;
    playerAccountName: string;
    playerUsername: string;
    xp: ExperienceData;
    language: LanguageEnum;
    mode: ModesEnum;
    pp: number;
    ppRank: number;
    ppPerLanguage: Record<LanguageEnum, number>;
    gamesPlayedCount: number;
    recordsCount: number;
    records: {
        record_type: RecordsEnum;
        score: number;
        rank: number;
    }[];
    bestPerformances: {
        record_type: RecordsEnum;
        score: number;
        pp: number;
        weighted_pp: number;
        mode: ModesEnum;
        pp_weight: number;
    }[];
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: TSearchParams }) {
    const [paramsAwaited, searchParamsAwaited] = await Promise.all([params, searchParams]);
    const { id: playerId } = paramsAwaited;
    const { m: mode, l: language } = searchParamsAwaited;

    const selectedLanguage = isValidLanguageParam(language) ? language : null;
    const selectedMode = isValidGameModeParam(mode) ? mode : null;

    const playerDataResponse = await getFromApi(
        `/player-profile?playerId=${playerId}${selectedLanguage ? `&language=${selectedLanguage}` : ""}${selectedMode ? `&mode=${selectedMode}` : ""}`
    );
    const playerData: IPlayerProfileData = await playerDataResponse.json();

    return <PlayerProfilePage playerData={playerData} />;
}
