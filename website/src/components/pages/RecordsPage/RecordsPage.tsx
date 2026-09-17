import ScoreDisplayComponent from "@/components/pages/RecordsPage/RecordsPageScoreDisplayComponent";
import { ExperienceData, type LanguageEnum, type ModesEnum, type RecordsEnum } from "@/lib/records";
import PlayerCard from "../common/PlayerCard";
import PlayerRow from "../common/PlayerRow";
import RecordsListLayout from "../common/RecordListLayout";
import ViewRecapLink from "../common/ViewRecapLink";
import RecordsPageSelectors from "./RecordsPageSelectors";

export interface IScoreData {
    id: string;
    accountName: string;
    name: string;
    avatarUrl?: string;
    rank: number;
    xp: ExperienceData;
    score: number;
    recapId?: string | null;
}

type RecordsPageProps = {
    language: LanguageEnum;
    mode: ModesEnum;
    record: RecordsEnum;
    data: IScoreData[];
    maxPage: number;
    isFirstPage: boolean;
};

export default function RecordsPage({ data, language, mode, record, maxPage, isFirstPage }: RecordsPageProps) {
    const top3Records = isFirstPage ? data.slice(0, 3) : [];
    const otherRecords = isFirstPage ? data.slice(3) : data;

    const rows = otherRecords.map((recordData) => {
        return (
            <div key={recordData.id} className="relative">
                <PlayerRow
                    playerData={recordData}
                    className={recordData.recapId ? "pr-14" : undefined}
                    PlayerRowContentSection={
                        <div>
                            <ScoreDisplayComponent score={recordData.score} recordType={record} />
                        </div>
                    }
                />
                {recordData.recapId ? (
                    <ViewRecapLink recapId={recordData.recapId} className="absolute top-1/2 right-3 z-10 -translate-y-1/2" />
                ) : null}
            </div>
        );
    });

    const cards = top3Records.map((recordData) => {
        return (
            <div
                key={recordData.id}
                className={`relative h-full ${recordData.rank === 1 ? "col-span-1 sm:col-span-2 md:col-span-1" : ""}`}
            >
                <PlayerCard
                    playerData={recordData}
                    className="block h-full"
                    PlayerCardContentSection={
                        <div className="h-[2rem] space-y-1">
                            <div className="flex items-center justify-center font-medium">
                                <ScoreDisplayComponent score={recordData.score} recordType={record} />
                            </div>
                        </div>
                    }
                />
                {recordData.recapId ? (
                    <ViewRecapLink recapId={recordData.recapId} className="absolute right-2 bottom-2 z-10" />
                ) : null}
            </div>
        );
    });

    return (
        <RecordsListLayout
            maxPage={maxPage}
            Selectors={
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:flex">
                    <RecordsPageSelectors language={language} mode={mode} record={record} />
                </div>
            }
            Rows={rows}
            Cards={cards}
        />
    );
}
