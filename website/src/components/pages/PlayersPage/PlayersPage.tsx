import { IPlayerScoreCommonProps } from "@/components/pages/common/types";
import { sortModeEnumSchema } from "@/lib/validation";
import PlayerCard from "../common/PlayerCard";
import PlayerRow from "../common/PlayerRow";
import RecordsListLayout from "../common/RecordListLayout";
import PlayersPageSwitchModeButtons from "./PlayersPageSwitchModeButtons";

export interface IPlayerCardDataExperience extends IPlayerScoreCommonProps {
    experience: number;
    experienceNeededForNextLevel: number;
}

export interface IPlayerCardDataRecords extends IPlayerScoreCommonProps {
    recordsCount: number;
}

export interface IPlayerCardDataPP extends IPlayerScoreCommonProps {
    pp: number;
}

export type PlayersPageData =
    | {
          sortMode: "experience";
          data: IPlayerCardDataExperience[];
      }
    | {
          sortMode: "records";
          data: IPlayerCardDataRecords[];
      }
    | {
          sortMode: "pp";
          data: IPlayerCardDataPP[];
      };

export default function PlayersPage({ pageData }: { pageData: PlayersPageData }) {
    const firstThreeScores = pageData.data.slice(0, 3);
    const otherScores = pageData.data.slice(3);

    if (pageData.sortMode === sortModeEnumSchema.Values.experience) {
        const rows = otherScores.map((player, i) => {
            const p = player as IPlayerCardDataExperience;
            return (
                <PlayerRow
                    key={i}
                    PlayerRowContentSection={
                        <div>
                            <p className="text-sm text-neutral-600">
                                Level <span className="font-bold text-neutral-950">{p.level}</span>
                            </p>
                        </div>
                    }
                    playerData={player}
                />
            );
        });

        const cards = firstThreeScores.map((player, i) => {
            const p = player as IPlayerCardDataExperience;
            return (
                <PlayerCard
                    key={i}
                    playerData={p}
                    PlayerCardContentSection={
                        <div className="h-[2rem] space-y-1">
                            <div className="flex items-center justify-between text-sm font-medium text-neutral-600">
                                <p>
                                    Level <span className="text-neutral-950">{player.level}</span>
                                </p>
                                <p className="text-xs font-normal">
                                    {p.experience} / {p.experienceNeededForNextLevel} xp
                                </p>
                            </div>
                            <div className="h-2 rounded bg-neutral-100">
                                <div
                                    className="bg-primary-500 h-2 rounded"
                                    style={{
                                        width: `${((p.experience / p.experienceNeededForNextLevel) * 100).toFixed(5)}%`,
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
                Selectors={<PlayersPageSwitchModeButtons sortMode={pageData.sortMode} />}
                Rows={rows}
                Cards={cards}
            />
        );
    } else if (pageData.sortMode === sortModeEnumSchema.Values.pp) {
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
                Selectors={<PlayersPageSwitchModeButtons sortMode={pageData.sortMode} />}
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
                Selectors={<PlayersPageSwitchModeButtons sortMode={pageData.sortMode} />}
                Rows={rows}
                Cards={cards}
            />
        );
    }
}
