import { IPlayerScoreCommonProps } from "@/components/pages/common/types";
import OptionalImage from "@/components/ui/OptionalImage";
import { gridColsTailwindClass } from "./RecordListLayout";

export default function PlayerRow<T extends IPlayerScoreCommonProps>({
    playerData,
    PlayerRowContentSection,
}: {
    playerData: T;
    PlayerRowContentSection: React.ReactNode;
}) {
    return (
        <div
            className={`grid w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-1.5 ${gridColsTailwindClass}`}
        >
            <div>
                <div className="flex h-5 w-5 items-center justify-center rounded-md p-4 font-semibold">{playerData.rank}</div>
            </div>
            <div>
                <div className="flex items-center gap-4">
                    <OptionalImage src={playerData.avatarUrl} commonClasses="h-8 w-8 min-h-8 min-w-8" height={100} width={100} />
                    <p className="truncate font-bold text-nowrap text-neutral-950">{playerData.name}</p>
                </div>
            </div>
            {PlayerRowContentSection}
        </div>
    );
}
