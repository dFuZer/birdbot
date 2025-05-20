"use client";

import ModeSelect from "@/components/pages/common/ModeSelect";
import useChangeSearchParam from "@/lib/hooks/useChangeSearchParam";
import { ModesEnum } from "@/lib/records";

export default function PlayerProfilePageSelectors({ mode }: { mode: ModesEnum }) {
    const changeSearchParam = useChangeSearchParam({ scroll: false });

    return (
        <div>
            <p className="mb-1 text-sm font-medium">Mode</p>
            <ModeSelect mode={mode} onChangeMode={(value) => changeSearchParam({ m: value, page: null })} />
        </div>
    );
}
