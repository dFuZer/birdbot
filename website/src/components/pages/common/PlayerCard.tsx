import { IPlayerScoreCommonProps } from "@/components/pages/common/types";
import OptionalImage from "@/components/ui/OptionalAvatar";
import { getTrophyGraphicByRank } from "@/components/ui/TrophyGraphic";
import getPlaceStringFromRank from "@/lib/stringGenerators";

export default function PlayerCard<T extends IPlayerScoreCommonProps>({
    playerData,
    PlayerCardContentSection,
}: {
    playerData: T;
    PlayerCardContentSection: React.ReactNode;
}) {
    return (
        <div
            className={`rounded-xl border border-neutral-200 bg-white p-4 text-nowrap ${playerData.rank === 1 ? "col-span-1 sm:col-span-2 md:col-span-1" : ""}`}
        >
            <div className="flex items-center gap-8">
                <div className="relative h-10 flex-1 items-center">
                    <div className="absolute top-0 left-0 flex h-full w-full gap-4">
                        <OptionalImage
                            src={playerData.avatarUrl}
                            commonClasses="h-10 min-h-10 w-10 min-w-10"
                            height={100}
                            width={100}
                            placeholderType="user"
                        />
                        <div className="truncate">
                            <p className="truncate font-bold text-nowrap">{playerData.name}</p>
                            <p className="text-sm text-neutral-600">Level {playerData.level}</p>
                        </div>
                    </div>
                </div>
                {getTrophyGraphicByRank(playerData.rank)}
            </div>
            <div className="my-6 flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-neutral-200"></div>
                <div className="text-xs tracking-[.2rem] text-neutral-500">{getPlaceStringFromRank(playerData.rank)}</div>
                <div className="h-[1px] flex-1 bg-neutral-200"></div>
            </div>
            {PlayerCardContentSection}
        </div>
    );
}
