"use client";

import { Button } from "@/components/ui/button";
import { sortModeEnumSchema, type SortModeEnum } from "@/lib/validation";
import { AcademicCapIcon as AcademicCapIconOutline, TrophyIcon as TrophyIconOutline } from "@heroicons/react/24/outline";
import { AcademicCapIcon as AcademicCapIconSolid, TrophyIcon as TrophyIconSolid } from "@heroicons/react/24/solid";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function PlayersPageSwitchModeButtons() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSortMode = useMemo<SortModeEnum>(() => {
        const sort = searchParams.get("sort");
        if (sort === sortModeEnumSchema.Values.experience || sort === sortModeEnumSchema.Values.records) {
            return sort;
        }
        return sortModeEnumSchema.Values.experience;
    }, [searchParams]);

    function onChangeMode(mode: SortModeEnum) {
        router.push(`/players?sort=${mode}`);
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:flex">
            <Button
                className={`!px-8 transition-colors duration-250 ${currentSortMode === sortModeEnumSchema.Values.experience ? "" : "bg-neutral-50"}`}
                variant={currentSortMode === sortModeEnumSchema.Values.experience ? "primary" : "ghost"}
                onClick={() => onChangeMode(sortModeEnumSchema.Values.experience)}
            >
                {currentSortMode === sortModeEnumSchema.Values.experience ? (
                    <AcademicCapIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />
                ) : (
                    <AcademicCapIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />
                )}
                Experience
            </Button>
            <Button
                className={`!px-8 transition-colors duration-250 ${currentSortMode === sortModeEnumSchema.Values.records ? "" : "bg-neutral-50"}`}
                variant={currentSortMode === sortModeEnumSchema.Values.records ? "primary" : "ghost"}
                onClick={() => onChangeMode(sortModeEnumSchema.Values.records)}
            >
                {currentSortMode === sortModeEnumSchema.Values.records ? (
                    <TrophyIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />
                ) : (
                    <TrophyIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />
                )}
                Records
            </Button>
        </div>
    );
}
