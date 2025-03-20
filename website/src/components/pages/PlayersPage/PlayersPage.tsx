import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import PlayersPageSwitchModeButtons from "@/components/pages/PlayersPage/PlayersPageSwitchModeButtons";
import { getTrophyGraphicByRank } from "@/components/pages/PlayersPage/TrophyGraphic";
import getPlaceStringFromRank from "@/lib/getPlaceStringFromRank";

export type IPlayersPageSortMode = "experience" | "records";

type IPlayerCardData = {
    name: string;
    avatarUrl?: string;
    rank: number;
    experience: number;
    level: number;
    experienceNeededForNextLevel: number;
};

const samplePlayerCardData: IPlayerCardData = {
    name: "dFuZer",
    rank: 1,
    avatarUrl: "https://avatars.githubusercontent.com/u/1402801?v=4",
    experience: 243,
    level: 12,
    experienceNeededForNextLevel: 500,
};

const playerSampleData: IPlayerCardData[] = Array.from({ length: 10 })
    .map((x) => samplePlayerCardData)
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
                    <img src={samplePlayerCardData.avatarUrl} alt="avatar" className="h-10 w-10 rounded-md" />
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
            <div className="space-y-1">
                <div className="flex items-center justify-between text-sm font-medium text-neutral-600">
                    <p>
                        Level <span className="text-neutral-950">{playerData.level}</span>
                    </p>
                    <p className="text-xs font-normal">
                        {playerData.experience} / {playerData.experienceNeededForNextLevel} xp
                    </p>
                </div>
                <div className="h-2 rounded bg-neutral-100">
                    <div
                        className="bg-primary-500 h-2 rounded"
                        style={{
                            width: `${((playerData.experience / playerData.experienceNeededForNextLevel) * 100).toFixed(5)}%`,
                        }}
                    ></div>
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
                    <img src={samplePlayerCardData.avatarUrl} alt="avatar" className="h-8 w-8 rounded-md" />
                    <p className="font-bold text-neutral-950">{playerData.name}</p>
                </div>
            </div>
            <div>
                <p className="text-sm text-neutral-600">
                    Level <span className="font-bold text-neutral-950">{playerData.level}</span>
                </p>
            </div>
        </div>
    );
}

export default function PlayersPage({ sortMode }: { sortMode: IPlayersPageSortMode }) {
    let top3Players = playerSampleData.slice(0, 3);
    let otherPlayers = playerSampleData.slice(3);

    return (
        <div className="flex min-h-screen justify-center px-4 py-10">
            <div className="max-w-4xl flex-1 rounded-xl bg-white/70 p-4 shadow-xl">
                <div className="flex w-full justify-between gap-4">
                    <PlayersPageSwitchModeButtons />
                    <Button className="flex min-w-48 items-center justify-between gap-6" variant={"outline"}>
                        <span className="font-light text-neutral-400">Search for a player</span>
                        <MagnifyingGlassIcon className="h-5 w-5 text-neutral-700" />
                    </Button>
                </div>
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
            </div>
        </div>
    );
}
