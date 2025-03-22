import { IScoreData } from "@/app/records/page";
import ScoreDisplayComponent from "@/components/pages/RecordsPage/RecordsPageScoreDisplayComponent";
import OptionalImage from "@/components/ui/OptionalAvatar";
import { getTrophyGraphicByRank } from "@/components/ui/TrophyGraphic";
import getPlaceStringFromRank from "@/lib/getPlaceStringFromRank";
import { RecordsEnum } from "@/records";

type RecordsPageScoreCardProps = {
    recordData: IScoreData;
    recordType: RecordsEnum;
};

export default function RecordsPageScoreCard({ recordData, recordType }: RecordsPageScoreCardProps) {
    return (
        <div
            className={`rounded-xl border border-neutral-200 bg-white p-4 text-nowrap ${recordData.rank === 1 ? "col-span-1 sm:col-span-2 md:col-span-1" : ""}`}
        >
            <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-4">
                    <OptionalImage
                        src={recordData.avatarUrl}
                        commonClasses="h-10 w-10"
                        height={100}
                        width={100}
                        placeholderType="user"
                    />
                    <div>
                        <p className="font-bold">{recordData.name}</p>
                        <p className="text-sm text-neutral-600">Level {recordData.level}</p>
                    </div>
                </div>
                {getTrophyGraphicByRank(recordData.rank)}
            </div>
            <div className="my-6 flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-neutral-200"></div>
                <div className="text-xs tracking-[.2rem] text-neutral-500">{getPlaceStringFromRank(recordData.rank)}</div>
                <div className="h-[1px] flex-1 bg-neutral-200"></div>
            </div>
            <div className="h-[2rem] space-y-1">
                <div className="flex items-center justify-center text-sm font-medium text-neutral-600">
                    <ScoreDisplayComponent score={recordData.score} recordType={recordType} />
                </div>
            </div>
        </div>
    );
}
