import GameRecapPage from "@/components/pages/OpenMonitoringPage/GameRecapPage";
import { getFromApi } from "@/lib/fetching";
import { GameRecapDetail, GameWordsPage } from "@/lib/gameRecaps";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
    title: "Game recap",
    description: "Inspect a game recap and every word played in that game.",
};

export default async function Page({ params }: { params: Promise<{ recapId: string }> }) {
    const { recapId } = await params;

    const recapResponse = await getFromApi(`/game-recaps/${encodeURIComponent(recapId)}`);
    if (recapResponse.status === 404) {
        notFound();
    }
    if (!recapResponse.ok) {
        throw new Error("Failed to load game recap");
    }

    const detail: GameRecapDetail = await recapResponse.json();
    const wordsResponse = await getFromApi(`/games/${encodeURIComponent(detail.recap.gameId)}/words?limit=100`);
    const initialWords: GameWordsPage = wordsResponse.ok
        ? await wordsResponse.json()
        : { rows: [], totalCount: 0, nextCursor: null };

    return <GameRecapPage detail={detail} initialWords={initialWords} />;
}
