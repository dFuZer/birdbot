"use client";

import { Button } from "@/components/ui/button";
import { PlayersPageSortModeEnum } from "@/lib/params";
import { AcademicCapIcon as AcademicCapIconOutline, TrophyIcon as TrophyIconOutline } from "@heroicons/react/24/outline";
import { AcademicCapIcon as AcademicCapIconSolid, TrophyIcon as TrophyIconSolid } from "@heroicons/react/24/solid";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function PlayersPageSwitchModeButtons() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSortMode = useMemo<PlayersPageSortModeEnum>(() => {
        const sort = searchParams.get("sort");
        if (sort === PlayersPageSortModeEnum.Experience || sort === PlayersPageSortModeEnum.Records) {
            return sort;
        }
        return PlayersPageSortModeEnum.Experience;
    }, [searchParams]);

    function onChangeMode(mode: PlayersPageSortModeEnum) {
        router.push(`/players?sort=${mode}`);
    }

    return (
        <div className="flex gap-3">
            <Button
                className="transition-colors duration-250"
                variant={currentSortMode === PlayersPageSortModeEnum.Experience ? "primary" : "ghost"}
                onClick={() => onChangeMode(PlayersPageSortModeEnum.Experience)}
            >
                {currentSortMode === PlayersPageSortModeEnum.Experience ? (
                    <AcademicCapIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />
                ) : (
                    <AcademicCapIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />
                )}
                Experience
            </Button>
            <Button
                className="transition-colors duration-250"
                variant={currentSortMode === PlayersPageSortModeEnum.Records ? "primary" : "ghost"}
                onClick={() => onChangeMode(PlayersPageSortModeEnum.Records)}
            >
                {currentSortMode === PlayersPageSortModeEnum.Records ? (
                    <TrophyIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />
                ) : (
                    <TrophyIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />
                )}
                Records
            </Button>
        </div>
    );
}
