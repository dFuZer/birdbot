import OpenMonitoringPage from "@/components/pages/OpenMonitoringPage/OpenMonitoringPage";
import { getFromApi } from "@/lib/fetching";
import { TSearchParams } from "@/lib/params";
import { isValidOpenMonitoringTabParam, openMonitoringTabEnumSchema } from "@/lib/validation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Open monitoring",
    description: "Visualize every player's lexical variety and unicity.",
};

export type OpenMonitoringPlayer = {
    accountName: string;
    username: string;
    wordsPlaced: number;
    distinctWords: number;
    exclusiveWords: number;
    variety: number;
    unicity: number;
};

type OpenMonitoringApiResponse = {
    players: OpenMonitoringPlayer[];
};

export default async function Page({ searchParams: searchParamsPromise }: { searchParams: TSearchParams }) {
    const searchParams = await searchParamsPromise;
    const tab = isValidOpenMonitoringTabParam(searchParams.tab) ? searchParams.tab : openMonitoringTabEnumSchema.Values.graphs;

    let players: OpenMonitoringPlayer[] = [];

    if (tab === openMonitoringTabEnumSchema.Values.graphs) {
        try {
            const response = await getFromApi("/open-monitoring");
            if (response.ok) {
                const json: OpenMonitoringApiResponse = await response.json();
                players = json.players ?? [];
            }
        } catch {
            players = [];
        }
    }

    return <OpenMonitoringPage players={players} tab={tab} />;
}
