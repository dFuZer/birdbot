import { IScoreData } from "@/app/records/page";
import ScoreDisplayComponent from "@/components/pages/RecordsPage/RecordsPageScoreDisplayComponent";
import OptionalImage from "@/components/ui/OptionalAvatar";
import { RecordsEnum } from "@/records";

type RecordsPageScoreRowProps = {
    recordData: IScoreData;
    recordType: RecordsEnum;
};

export default function RecordsPageScoreRow({ recordData, recordType }: RecordsPageScoreRowProps) {
    return (
        <div className="grid w-full grid-cols-3 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-1.5">
            <div>
                <div className="flex h-5 w-5 items-center justify-center rounded-md p-4 font-semibold">{recordData.rank}</div>
            </div>
            <div>
                <div className="flex items-center gap-4">
                    <OptionalImage src={recordData.avatarUrl} commonClasses="h-8 w-8" height={100} width={100} />
                    <p className="font-bold text-neutral-950">{recordData.name}</p>
                </div>
            </div>
            <div>
                <ScoreDisplayComponent score={recordData.score} recordType={recordType} />
            </div>
        </div>
    );
}
