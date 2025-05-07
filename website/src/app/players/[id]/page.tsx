import { getFromApi } from "@/lib/fetching";
import { TSearchParams } from "@/lib/params";
import { isValidGameModeParam, isValidLanguageParam } from "@/lib/validation";
import { LanguageEnum, ModesEnum, RecordsEnum } from "@/lib/records";
import PlayerProfilePage from "@/components/pages/PlayersPage/PlayerProfilePage";

/*{
  foundUsername: 'Sarah Jackson',
  playerId: '92f4e838-9daf-4976-a332-98dab4a29b43',
  playerAccountName: 'William Hill',
  playerUsername: 'Sarah Jackson',
  xp: 0,
  language: 'fr',
  mode: 'sub50',
  records: [
    { record_type: 'alpha', score: 318, rank: 2 },
    { record_type: 'depleted_syllables', score: 457, rank: 1 },
    { record_type: 'flips', score: 414, rank: 1 },
    { record_type: 'hyphen', score: 192, rank: 1 },
    { record_type: 'more_than_20_letters', score: 256, rank: 2 },
    { record_type: 'multi_syllable', score: 216, rank: 1 },
    { record_type: 'previous_syllable', score: 220, rank: 2 },
    { record_type: 'time', score: 1417843, rank: 2 },
    { record_type: 'word', score: 294, rank: 1 },
    { record_type: 'no_death', score: 281, rank: 1 }
  ]
}*/

export interface IPlayerProfileData {
    foundUsername: string;
    playerId: string;
    playerAccountName: string;
    playerUsername: string;
    xp: number;
    language: LanguageEnum;
    mode: ModesEnum;
    records: {
        record_type: RecordsEnum;
        score: number;
        rank: number;
    }[];
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: TSearchParams }) {
    const [paramsAwaited, searchParamsAwaited] = await Promise.all([params, searchParams]);
    const { id } = paramsAwaited;
    const { m: mode, l: language } = searchParamsAwaited;

    const selectedLanguage = isValidLanguageParam(language) ? language : null;
    const selectedMode = isValidGameModeParam(mode) ? mode : null;

    const playerDataResponse = await getFromApi(
        `/player-profile?playerId=${id}${selectedLanguage ? `&language=${selectedLanguage}` : ""}${selectedMode ? `&mode=${selectedMode}` : ""}`
    );
    const playerData: IPlayerProfileData = await playerDataResponse.json();

    return <PlayerProfilePage playerData={playerData} />;
}
