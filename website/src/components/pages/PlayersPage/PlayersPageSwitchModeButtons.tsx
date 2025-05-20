"use client";

import useChangeSearchParam from "@/components/hooks/useChangeSearchParam";
import { Button } from "@/components/ui/button";
import { sortModeEnumSchema, type SortModeEnum } from "@/lib/validation";
import {
    AcademicCapIcon as AcademicCapIconOutline,
    SparklesIcon as SparklesIconOutline,
    TrophyIcon as TrophyIconOutline,
} from "@heroicons/react/24/outline";
import {
    AcademicCapIcon as AcademicCapIconSolid,
    SparklesIcon as SparklesIconSolid,
    TrophyIcon as TrophyIconSolid,
} from "@heroicons/react/24/solid";

function SwitchButton({
    label,
    icon,
    activeIcon,
    active,
    sortMode,
    changeSearchParam,
}: {
    label: string;
    icon: React.ReactNode;
    activeIcon: React.ReactNode;
    active: boolean;
    sortMode: SortModeEnum;
    changeSearchParam: (key: string, value: string) => void;
}) {
    return (
        <Button
            className={`transition-colors duration-250 sm:w-40 ${active ? "" : "bg-neutral-50"}`}
            variant={active ? "primary" : "ghost"}
            onClick={() => changeSearchParam("sort", sortMode)}
        >
            {active ? activeIcon : icon}
            {label}
        </Button>
    );
}

export default function PlayersPageSwitchModeButtons({ sortMode }: { sortMode: SortModeEnum }) {
    const changeSearchParam = useChangeSearchParam();

    return (
        <div className="grid grid-cols-2 gap-3 sm:flex">
            <SwitchButton
                label="PP"
                icon={<SparklesIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />}
                activeIcon={<SparklesIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />}
                active={sortMode === sortModeEnumSchema.Values.pp}
                sortMode={sortModeEnumSchema.Values.pp}
                changeSearchParam={changeSearchParam}
            />
            <SwitchButton
                label="Experience"
                icon={<AcademicCapIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />}
                activeIcon={<AcademicCapIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />}
                active={sortMode === sortModeEnumSchema.Values.xp}
                sortMode={sortModeEnumSchema.Values.xp}
                changeSearchParam={changeSearchParam}
            />
            <SwitchButton
                label="Records"
                icon={<TrophyIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />}
                activeIcon={<TrophyIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />}
                active={sortMode === sortModeEnumSchema.Values.records}
                sortMode={sortModeEnumSchema.Values.records}
                changeSearchParam={changeSearchParam}
            />
        </div>
    );
}
