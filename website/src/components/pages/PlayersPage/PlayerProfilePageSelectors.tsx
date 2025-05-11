"use client";

import useChangeSearchParam from "@/components/hooks/useChangeSearchParam";
import ModeSelect from "@/components/pages/common/ModeSelect";
import { ModesEnum } from "@/lib/records";

export default function PlayerProfilePageSelectors({ mode }: { mode: ModesEnum }) {
    const changeSearchParam = useChangeSearchParam({ scroll: false });

    return (
        <div>
            <p className="mb-1 text-sm font-medium">Mode</p>
            <ModeSelect mode={mode} onChangeMode={(value) => changeSearchParam("m", value)} />
        </div>
    );
}
