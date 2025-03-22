import ScoreDisplayComponent from "@/components/pages/RecordsPage/RecordsPageScoreDisplayComponent";
import { GameModesEnum, LanguagesEnum, RecordsEnum } from "@/records";
import PlayerCard from "../common/PlayerCard";
import PlayerRow from "../common/PlayerRow";
import RecordsListLayout from "../common/RecordListLayout";
import RecordsPageSelectors from "./RecordsPageSelectors";

export interface IScoreData {
    name: string;
    avatarUrl?: string;
    rank: number;
    level: number;
    score: number;
}

type RecordsPageProps = {
    language: LanguagesEnum;
    mode: GameModesEnum;
    record: RecordsEnum;
    data: IScoreData[];
};

export default function RecordsPage({ data, language, mode, record }: RecordsPageProps) {
    const top3Records = data.slice(0, 3);
    const otherRecords = data.slice(3);

    const rows = otherRecords.map((recordData, i) => {
        return (
            <PlayerRow
                key={i}
                playerData={recordData}
                PlayerRowContentSection={
                    <div>
                        <ScoreDisplayComponent score={recordData.score} recordType={record} />
                    </div>
                }
            />
        );
    });

    const cards = top3Records.map((recordData, i) => {
        return (
            <PlayerCard
                key={i}
                playerData={recordData}
                PlayerCardContentSection={
                    <div className="h-[2rem] space-y-1">
                        <div className="flex items-center justify-center font-medium">
                            <ScoreDisplayComponent score={recordData.score} recordType={record} />
                        </div>
                    </div>
                }
            />
        );
    });

    return (
        <RecordsListLayout
            Selectors={
                <div className="flex gap-3">
                    <RecordsPageSelectors language={language} mode={mode} record={record} />
                </div>
            }
            Rows={rows}
            Cards={cards}
        />
    );
}
