"use client";

import { Button } from "@/components/ui/button";
import useChangeSearchParam from "@/lib/hooks/useChangeSearchParam";
import { openMonitoringTabEnumSchema, type OpenMonitoringTabEnum } from "@/lib/validation";
import {
    ChartBarIcon as ChartBarIconOutline,
    ClipboardDocumentListIcon as ClipboardDocumentListIconOutline,
} from "@heroicons/react/24/outline";
import {
    ChartBarIcon as ChartBarIconSolid,
    ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
} from "@heroicons/react/24/solid";

function SwitchButton({
    label,
    icon,
    activeIcon,
    active,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    activeIcon: React.ReactNode;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <Button
            className={`transition-colors duration-250 sm:w-40 ${active ? "" : "bg-neutral-50"}`}
            variant={active ? "primary" : "ghost"}
            onClick={onClick}
        >
            {active ? activeIcon : icon}
            {label}
        </Button>
    );
}

export default function OpenMonitoringPageSwitchTabButtons({ tab }: { tab: OpenMonitoringTabEnum }) {
    const changeSearchParam = useChangeSearchParam();

    return (
        <div className="grid grid-cols-2 gap-3 sm:flex">
            <SwitchButton
                label="Graphs"
                icon={<ChartBarIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />}
                activeIcon={<ChartBarIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />}
                active={tab === openMonitoringTabEnumSchema.Values.graphs}
                onClick={() => changeSearchParam({ tab: "graphs" })}
            />
            <SwitchButton
                label="Game recaps"
                icon={<ClipboardDocumentListIconOutline className="text-primary-950 h-5 w-5 stroke-[1.5px]" />}
                activeIcon={<ClipboardDocumentListIconSolid className="h-5 w-5 stroke-[1.5px] text-neutral-50" />}
                active={tab === openMonitoringTabEnumSchema.Values.recaps}
                onClick={() => changeSearchParam({ tab: "recaps" })}
            />
        </div>
    );
}
