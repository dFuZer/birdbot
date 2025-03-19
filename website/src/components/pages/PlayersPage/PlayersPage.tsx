import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import PlayersPageSwitchModeButtons from "@/components/pages/PlayersPage/PlayersPageSwitchModeButtons";
import TrophyGraphic from "./TrophyGraphic";
import { getTrophyGraphicByRank } from "@/components/pages/PlayersPage/TrophyGraphic";

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

export default function PlayersPage() {
    return (
        <div className="flex min-h-screen justify-center px-4 py-10">
            <div className="max-w-4xl flex-1 rounded-xl bg-white/70 p-4 shadow-xl">
                <div className="flex w-full justify-between">
                    <PlayersPageSwitchModeButtons />
                    <Button className="flex min-w-48 items-center justify-between" variant={"outline"}>
                        <span className="font-light text-neutral-400">Rechercher</span>
                        <MagnifyingGlassIcon className="h-5 w-5 text-neutral-700" />
                    </Button>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 })
                        .map((x) => samplePlayerCardData)
                        .map((x, i) => {
                            return (
                                <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 text-nowrap">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={samplePlayerCardData.avatarUrl}
                                                alt="avatar"
                                                className="h-10 w-10 rounded-md"
                                            />
                                            <div>
                                                <p className="font-bold">{x.name}</p>
                                                <p className="text-sm text-neutral-600">Level {x.level}</p>
                                            </div>
                                        </div>
                                        {getTrophyGraphicByRank(i + 1)}
                                    </div>
                                    <div className="my-6 flex items-center gap-3">
                                        <div className="h-[1px] flex-1 bg-neutral-200"></div>
                                        <div className="text-xs tracking-[.2rem] text-neutral-500">1st place</div>
                                        <div className="h-[1px] flex-1 bg-neutral-200"></div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm font-medium text-neutral-600">
                                            <p>
                                                Level <span className="text-neutral-950">949</span>
                                            </p>
                                            <p className="text-xs font-normal">
                                                {x.experience} / {x.experienceNeededForNextLevel} xp
                                            </p>
                                        </div>
                                        <div className="h-2 rounded bg-neutral-100">
                                            <div
                                                className="bg-primary-500 h-2 rounded"
                                                style={{
                                                    width: `${((x.experience / x.experienceNeededForNextLevel) * 100).toFixed(5)}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
