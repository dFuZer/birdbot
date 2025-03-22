import PlayersPageContentSortByExperience from "@/components/pages/PlayersPage/PlayersPageContentSortByExperience";
import PlayersPageSwitchModeButtons from "@/components/pages/PlayersPage/PlayersPageSwitchModeButtons";
import { Button } from "@/components/ui/button";
import { PlayersPageSortModeEnum } from "@/types";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import PlayersPageContentSortByRecords from "./PlayersPageContentSortByRecords";

export interface IPlayerCardDataExperience {
    name: string;
    avatarUrl?: string;
    rank: number;
    experience: number;
    level: number;
    experienceNeededForNextLevel: number;
}

export interface IPlayerCardDataRecords {
    name: string;
    avatarUrl?: string;
    rank: number;
    level: number;
    recordsCount: number;
}

export type PlayersPageData =
    | {
          sortMode: PlayersPageSortModeEnum.Experience;
          data: IPlayerCardDataExperience[];
      }
    | {
          sortMode: PlayersPageSortModeEnum.Records;
          data: IPlayerCardDataRecords[];
      };

export default function PlayersPage({ pageData }: { pageData: PlayersPageData }) {
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
                {pageData.sortMode === PlayersPageSortModeEnum.Experience ? (
                    <PlayersPageContentSortByExperience data={pageData.data} />
                ) : (
                    <PlayersPageContentSortByRecords data={pageData.data} />
                )}
            </div>
        </div>
    );
}
