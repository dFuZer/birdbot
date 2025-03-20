"use client";

import { Button } from "@/components/ui/button";
import { TrophyIcon as TrophyIconSolid, AcademicCapIcon as AcademicCapIconSolid } from "@heroicons/react/24/solid";
import { AcademicCapIcon as AcademicCapIconOutline, TrophyIcon as TrophyIconOutline } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { type TPlayersPageSortMode } from "@/components/pages/PlayersPage/PlayersPage";

export default function PlayersPageSwitchModeButtons() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSortMode = useMemo<TPlayersPageSortMode>(() => {
        const sort = searchParams.get("sort");
        if (sort === "experience" || sort === "records") {
            return sort;
        }
        return "experience";
    }, [searchParams]);

    function onChangeMode(mode: TPlayersPageSortMode) {
        router.push(`/players?sort=${mode}`);
    }

    return (
        <div className="flex gap-3">
            <Button
                className="transition-colors duration-250"
                variant={currentSortMode === "experience" ? "primary" : "ghost"}
                onClick={() => onChangeMode("experience")}
            >
                {currentSortMode === "experience" ? (
                    <AcademicCapIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />
                ) : (
                    <AcademicCapIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />
                )}
                Experience
            </Button>
            <Button
                className="transition-colors duration-250"
                variant={currentSortMode === "records" ? "primary" : "ghost"}
                onClick={() => onChangeMode("records")}
            >
                {currentSortMode === "records" ? (
                    <TrophyIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />
                ) : (
                    <TrophyIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />
                )}
                Records
            </Button>
        </div>
    );
}
