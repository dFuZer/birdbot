import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import PlayersPageSwitchModeButtons from "@/components/pages/PlayersPage/PlayersPageSwitchModeButtons";
import PlayersPageContentSortByRecords from "./PlayersPageContentSortByRecords";
import PlayersPageContentSortByExperience from "@/components/pages/PlayersPage/PlayersPageContentSortByExperience";

export type IPlayersPageSortMode = "experience" | "records";

export default function PlayersPage({ sortMode }: { sortMode: IPlayersPageSortMode }) {
    return (
        <div className="flex min-h-screen justify-center px-4 py-10">
            <div className="max-w-4xl flex-1 rounded-xl bg-white/70 p-4 pb-6 shadow-xl">
                <div className="flex w-full justify-between gap-4">
                    <PlayersPageSwitchModeButtons />
                    <Button className="flex min-w-48 items-center justify-between gap-6" variant={"outline"}>
                        <span className="font-light text-neutral-400">Search for a player</span>
                        <MagnifyingGlassIcon className="h-5 w-5 text-neutral-700" />
                    </Button>
                </div>
                {sortMode === "experience" ? <PlayersPageContentSortByExperience /> : <PlayersPageContentSortByRecords />}
            </div>
        </div>
    );
}
