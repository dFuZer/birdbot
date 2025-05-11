import { IPlayerProfileData } from "@/app/players/[id]/page";
import PlayerProfilePageLanguageSelector from "@/components/pages/PlayersPage/PlayerProfilePageLanguageSelector";
import PlayerProfilePageSelectors from "@/components/pages/PlayersPage/PlayerProfilePageSelectors";
import ScoreDisplayComponent from "@/components/pages/RecordsPage/RecordsPageScoreDisplayComponent";
import OptionalImage from "@/components/ui/OptionalImage";
import { GAME_MODES_DATA, RECORDS_DATA } from "@/lib/records";

export default function PlayerProfilePage({ playerData }: { playerData: IPlayerProfileData }) {
    return (
        <div className="flex min-h-screen justify-center px-4 py-6 sm:py-10">
            <div className="relative flex-1 overflow-hidden pb-6 sm:max-w-3xl sm:rounded-xl sm:bg-white/70 sm:shadow-xl">
                <div className="bg-primary-600 h-25 w-full" />
                <div className="absolute left-1/2 size-25 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg">
                    <OptionalImage
                        src={playerData.avatarUrl}
                        commonClasses="h-full w-full"
                        height={150}
                        width={150}
                        placeholderType="user"
                    />
                </div>
                <div className="flex justify-end pt-2 pr-2">
                    <PlayerProfilePageLanguageSelector language={playerData.language} ppPerLanguage={playerData.ppPerLanguage} />
                </div>
                <h2 className="mt-10 text-center text-2xl font-bold">{playerData.playerUsername}</h2>
                <div className="mx-auto mt-5 h-[2rem] w-[20rem] space-y-1">
                    <div className="flex items-center justify-between text-sm font-medium text-neutral-600">
                        <p>
                            Level <span className="text-neutral-950">{playerData.xp.level}</span>
                        </p>
                        <p className="text-xs font-normal">
                            {playerData.xp.currentLevelXp} / {playerData.xp.totalLevelXp} xp
                        </p>
                    </div>
                    <div className="h-2 rounded bg-neutral-100">
                        <div
                            className="bg-primary-500 h-2 rounded"
                            style={{
                                width: `${playerData.xp.percentageToNextLevel.toFixed(5)}%`,
                            }}
                        ></div>
                    </div>
                </div>
                <div className="mt-10 flex w-full items-center justify-center gap-12 bg-[#EBEBEB]/50 py-10 shadow-lg">
                    <div className="flex flex-col items-center">
                        <p className="text-2xl font-bold">{playerData.recordsCount}</p>
                        <p className="font-medium text-neutral-700">records</p>
                    </div>
                    <div className="h-[3rem] w-[1px] bg-neutral-300"></div>
                    <div className="flex flex-col items-center">
                        <p className="text-2xl font-bold">{playerData.gamesPlayedCount}</p>
                        <p className="font-medium text-neutral-700">games</p>
                    </div>
                    <div className="h-[3rem] w-[1px] bg-neutral-300"></div>
                    <div className="flex flex-col items-center">
                        <p className="text-2xl font-bold">{playerData.pp}</p>
                        <p className="font-medium text-neutral-700">pp</p>
                    </div>
                    <div className="h-[3rem] w-[1px] bg-neutral-300"></div>
                    <div className="flex flex-col items-center">
                        <p className="text-2xl font-bold">#{playerData.ppRank}</p>
                        <p className="font-medium text-neutral-700">rank</p>
                    </div>
                </div>
                <div className="px-10">
                    <h3 className="mt-10 text-2xl font-bold">Top performances</h3>
                    <div className="mt-12 space-y-2">
                        <div
                            className={`grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)_5rem_7rem] items-center gap-4 px-4 text-sm text-gray-600`}
                        >
                            <div>Category</div>
                            <div>Score</div>
                            <div>pp</div>
                            <div>Gained pp</div>
                        </div>
                        {playerData.bestPerformances.length ? (
                            playerData.bestPerformances.map((item) => {
                                return (
                                    <div
                                        key={item.record_type}
                                        className={`grid min-h-11 w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)_5rem_7rem] items-center gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-1.5`}
                                    >
                                        <div>
                                            <p className="truncate font-semibold text-nowrap text-neutral-950">
                                                {RECORDS_DATA[item.record_type].displayName}{" "}
                                                {item.mode !== "regular" && (
                                                    <span className="text-sm font-normal text-neutral-500">
                                                        {GAME_MODES_DATA[item.mode].displayName}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <ScoreDisplayComponent score={item.score} recordType={item.record_type} />
                                        </div>
                                        <div className="text-neutral-500">{item.pp}pp</div>
                                        <div className="text-primary-800 flex items-center justify-between gap-1 font-bold">
                                            {item.weighted_pp}pp{" "}
                                            <span className="text-xs font-normal text-neutral-500">{`${Math.round(item.pp_weight * 100)}%`}</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="my-10 flex items-center justify-center text-neutral-700">No performances found</div>
                        )}
                    </div>
                </div>
                <div className="px-10">
                    <h3 className="mt-10 mb-10 text-2xl font-bold">Personal records</h3>
                    <div className="flex gap-4">
                        <PlayerProfilePageSelectors mode={playerData.mode} />
                    </div>
                    <div className="mt-6 space-y-2">
                        <div
                            className={`grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem] items-center gap-2 px-4 text-sm text-gray-600`}
                        >
                            <div>Record</div>
                            <div>Score</div>
                            <div>Rank</div>
                        </div>
                        {playerData.records.length ? (
                            playerData.records.map((item) => {
                                return (
                                    <div
                                        key={item.record_type}
                                        className={`grid min-h-11 w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem] items-center gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-1.5`}
                                    >
                                        <div>
                                            <p className="truncate font-semibold text-nowrap text-neutral-950">
                                                {RECORDS_DATA[item.record_type].displayName}
                                            </p>
                                        </div>
                                        <div>
                                            <ScoreDisplayComponent score={item.score} recordType={item.record_type} />
                                        </div>
                                        <div>#{item.rank}</div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="my-10 flex items-center justify-center text-neutral-700">No records found</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
