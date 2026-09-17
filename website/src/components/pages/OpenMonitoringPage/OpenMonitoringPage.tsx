import type { OpenMonitoringPlayer } from "@/app/open-monitoring/page";
import { katibehFont } from "@/app/fonts";
import { openMonitoringTabEnumSchema, type OpenMonitoringTabEnum } from "@/lib/validation";
import GameRecapsTab from "./GameRecapsTab";
import GraphsTab from "./GraphsTab";
import OpenMonitoringPageSwitchTabButtons from "./OpenMonitoringPageSwitchTabButtons";

export default function OpenMonitoringPage({
    players,
    tab,
}: {
    players: OpenMonitoringPlayer[];
    tab: OpenMonitoringTabEnum;
}) {
    return (
        <div className="flex min-h-screen justify-center px-4 py-6 sm:py-10">
            <div className="flex w-full flex-1 flex-col pb-6 sm:max-w-7xl sm:rounded-xl sm:bg-white/70 sm:p-6 sm:shadow-xl">
                <h1 className={`${katibehFont.className} text-4xl leading-none text-neutral-950 sm:text-5xl`}>Open monitoring</h1>
                <div className="mt-6">
                    <OpenMonitoringPageSwitchTabButtons tab={tab} />
                </div>
                <div className="mt-6">
                    {tab === openMonitoringTabEnumSchema.Values.recaps ? <GameRecapsTab /> : <GraphsTab players={players} />}
                </div>
            </div>
        </div>
    );
}
