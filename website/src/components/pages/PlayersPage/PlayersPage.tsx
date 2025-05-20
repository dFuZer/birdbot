import { IPlayerCardDataPP, IPlayerCardDataRecords, PlayersPageData } from "@/app/players/page";
import { IPlayerScoreCommonProps } from "@/components/pages/common/types";
import { sortModeEnumSchema } from "@/lib/validation";
import PlayerCard from "../common/PlayerCard";
import PlayerRow from "../common/PlayerRow";
import RecordsListLayout from "../common/RecordListLayout";
import PlayersPageSwitchModeButtons from "./PlayersPageSwitchModeButtons";

export default function PlayersPage({ pageData, isFirstPage }: { pageData: PlayersPageData; isFirstPage: boolean }) {
    const firstThreeScores = isFirstPage ? pageData.data.slice(0, 3) : [];
    const otherScores = isFirstPage ? pageData.data.slice(3) : pageData.data;

    if (pageData.mode === sortModeEnumSchema.Values.xp) {
        const rows = otherScores.map((player, i) => {
            const p = player as IPlayerScoreCommonProps;
            return (
                <PlayerRow
                    key={i}
                    PlayerRowContentSection={
                        <div>
                            <p className="text-sm text-neutral-600">
                                Level <span className="font-bold text-neutral-950">{p.xp.level}</span>
                            </p>
                        </div>
                    }
                    playerData={player}
                />
            );
        });

        const cards = firstThreeScores.map((player, i) => {
            const p = player as IPlayerScoreCommonProps;
            return (
                <PlayerCard
                    key={i}
                    playerData={p}
                    PlayerCardContentSection={
                        <div className="h-[2rem] space-y-1">
                            <div className="flex items-center justify-between text-sm font-medium text-neutral-600">
                                <p>
                                    Level <span className="text-neutral-950">{player.xp.level}</span>
                                </p>
                                <p className="text-xs font-normal">
                                    {p.xp.currentLevelXp} / {p.xp.totalLevelXp} xp
                                </p>
                            </div>
                            <div className="h-2 rounded bg-neutral-100">
                                <div
                                    className="bg-primary-500 h-2 rounded"
                                    style={{
                                        width: `${p.xp.percentageToNextLevel.toFixed(5)}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    }
                />
            );
        });

        return (
            <RecordsListLayout
                maxPage={pageData.maxPage}
                Selectors={<PlayersPageSwitchModeButtons sortMode={pageData.mode} />}
                Rows={rows}
                Cards={cards}
            />
        );
    } else if (pageData.mode === sortModeEnumSchema.Values.pp) {
        const rows = otherScores.map((player, i) => {
            const p = player as IPlayerCardDataPP;
            return (
                <PlayerRow
                    key={i}
                    PlayerRowContentSection={
                        <div>
                            <p className="text-sm font-bold text-neutral-950">
                                {p.pp} <span className="font-normal">pp</span>
                            </p>
                        </div>
                    }
                    playerData={player}
                />
            );
        });

        const cards = firstThreeScores.map((player, i) => {
            const p = player as IPlayerCardDataPP;
            return (
                <PlayerCard
                    key={i}
                    playerData={p}
                    PlayerCardContentSection={
                        <div className="h-[2rem] space-y-1">
                            <div className="flex items-center justify-center text-sm font-bold text-neutral-950">
                                <p>
                                    {p.pp} <span className="font-normal">pp</span>
                                </p>
                            </div>
                        </div>
                    }
                />
            );
        });

        return (
            <RecordsListLayout
                maxPage={pageData.maxPage}
                Selectors={<PlayersPageSwitchModeButtons sortMode={pageData.mode} />}
                Rows={rows}
                Cards={cards}
            />
        );
    } else {
        const rows = otherScores.map((player, i) => {
            const p = player as IPlayerCardDataRecords;
            return (
                <PlayerRow
                    key={i}
                    PlayerRowContentSection={
                        <div>
                            <p className="text-sm">
                                <span className="font-bold text-neutral-950">{p.recordsCount}</span> records
                            </p>
                        </div>
                    }
                    playerData={player}
                />
            );
        });

        const cards = firstThreeScores.map((player, i) => {
            const p = player as IPlayerCardDataRecords;
            return (
                <PlayerCard
                    key={i}
                    playerData={p}
                    PlayerCardContentSection={
                        <div className="h-[2rem] space-y-1">
                            <div className="flex items-center justify-center text-sm">
                                <p className="font-bold text-neutral-950">
                                    {p.recordsCount} <span className="font-normal">records</span>
                                </p>
                            </div>
                        </div>
                    }
                />
            );
        });

        return (
            <RecordsListLayout
                maxPage={pageData.maxPage}
                Selectors={<PlayersPageSwitchModeButtons sortMode={pageData.mode} />}
                Rows={rows}
                Cards={cards}
            />
        );
    }
}
