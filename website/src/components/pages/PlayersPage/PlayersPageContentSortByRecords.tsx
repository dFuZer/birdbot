import { getTrophyGraphicByRank } from "@/components/pages/PlayersPage/TrophyGraphic";
import getPlaceStringFromRank from "@/lib/getPlaceStringFromRank";
import OptionalImage from "@/components/ui/OptionalAvatar";

interface IPlayerCardData {
    name: string;
    avatarUrl?: string;
    rank: number;
    level: number;
    recordsCount: number;
}

const samplePlayerCardData: IPlayerCardData = {
    name: "dFuZer",
    rank: 1,
    avatarUrl: "https://avatars.githubusercontent.com/u/1402801?v=4",
    level: 12,
    recordsCount: 45,
};

const playerSampleData: IPlayerCardData[] = Array.from({ length: 10 })
    .map(() => samplePlayerCardData)
    .map((player, i) => {
        return { ...player, rank: i + 1, name: `${player.name} ${i + 1}` };
    });

function PlayerCard({ playerData }: { playerData: IPlayerCardData }) {
    return (
        <div
            className={`rounded-xl border border-neutral-200 bg-white p-4 text-nowrap ${playerData.rank === 1 ? "col-span-1 sm:col-span-2 md:col-span-1" : ""}`}
        >
            <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-4">
                    <OptionalImage src={playerData.avatarUrl} commonClasses="h-10 w-10" height={100} width={100} />
                    <div>
                        <p className="font-bold">{playerData.name}</p>
                        <p className="text-sm text-neutral-600">Level {playerData.level}</p>
                    </div>
                </div>
                {getTrophyGraphicByRank(playerData.rank)}
            </div>
            <div className="my-6 flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-neutral-200"></div>
                <div className="text-xs tracking-[.2rem] text-neutral-500">{getPlaceStringFromRank(playerData.rank)}</div>
                <div className="h-[1px] flex-1 bg-neutral-200"></div>
            </div>
            <div className="h-[2rem] space-y-1">
                <div className="flex items-center justify-center text-sm font-medium text-neutral-600">
                    <p>
                        <span className="text-neutral-950">{playerData.recordsCount}</span> records
                    </p>
                </div>
            </div>
        </div>
    );
}

function PlayerRow({ playerData }: { playerData: IPlayerCardData }) {
    return (
        <div className="grid w-full grid-cols-3 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-1.5">
            <div>
                <div className="flex h-5 w-5 items-center justify-center rounded-md p-4 font-semibold">{playerData.rank}</div>
            </div>
            <div>
                <div className="flex items-center gap-4">
                    <OptionalImage src={playerData.avatarUrl} commonClasses="h-8 w-8" height={100} width={100} />
                    <p className="font-bold text-neutral-950">{playerData.name}</p>
                </div>
            </div>
            <div>
                <p className="text-sm text-neutral-600">
                    <span className="font-bold text-neutral-950">{playerData.recordsCount}</span> records
                </p>
            </div>
        </div>
    );
}

export default function PlayersPageContentSortByRecords() {
    const top3Players = playerSampleData.slice(0, 3);
    const otherPlayers = playerSampleData.slice(3);

    return (
        <>
            <div className="mt-8 grid grid-cols-1 items-center gap-3 sm:grid-cols-2 md:grid-cols-3">
                {top3Players.map((player, i) => {
                    return <PlayerCard key={i} playerData={player} />;
                })}
            </div>
            <div className="mt-12 space-y-2">
                <div className="grid w-full grid-cols-3 items-center gap-2 px-4 text-sm text-gray-600">
                    <div>Place</div>
                    <div>User</div>
                    <div>Score</div>
                </div>
                {otherPlayers.map((player, i) => {
                    return <PlayerRow key={i} playerData={player} />;
                })}
            </div>
        </>
    );
}
