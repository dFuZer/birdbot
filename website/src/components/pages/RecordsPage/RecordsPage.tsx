import { IScoreData } from "@/app/records/page";
import RecordsPageScoreCard from "@/components/pages/RecordsPage/RecordsPageScoreCard";
import RecordsPageScoreRow from "@/components/pages/RecordsPage/RecordsPageScoreRow";
import { GameModesEnum, LanguagesEnum, RecordsEnum } from "@/records";
import RecordsPageSelectors from "./RecordsPageSelectors";

type RecordsPageProps = {
    language: LanguagesEnum;
    mode: GameModesEnum;
    record: RecordsEnum;
    data: IScoreData[];
};

export default function RecordsPage({ data, language, mode, record }: RecordsPageProps) {
    const top3Records = data.slice(0, 3);
    const otherRecords = data.slice(3);

    return (
        <div className="flex min-h-screen justify-center px-4 py-10">
            <div className="max-w-4xl flex-1 rounded-xl bg-white/70 p-4 pb-6 shadow-xl">
                <div className="flex w-full justify-between gap-4">
                    <div className="flex gap-3">
                        <RecordsPageSelectors language={language} mode={mode} record={record} />
                    </div>
                </div>
                <div className="mt-8 grid grid-cols-1 items-center gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {top3Records.map((recordData, i) => {
                        return <RecordsPageScoreCard key={i} recordData={recordData} recordType={record} />;
                    })}
                </div>
                <div className="mt-12 space-y-2">
                    <div className="grid w-full grid-cols-3 items-center gap-2 px-4 text-sm text-gray-600">
                        <div>Place</div>
                        <div>User</div>
                        <div>Score</div>
                    </div>
                    {otherRecords.map((recordData, i) => {
                        return <RecordsPageScoreRow key={i} recordData={recordData} recordType={record} />;
                    })}
                </div>
            </div>
        </div>
    );
}
