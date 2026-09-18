"use client";

import type { OpenMonitoringPlayer } from "@/app/open-monitoring/page";
import Flag from "@/components/pages/common/Flag";
import { Button } from "@/components/ui/button";
import { downloadJson } from "@/lib/downloadJson";
import { LANGUAGE_DOT_COLORS, LANGUAGES_DATA, languageEnumSchema } from "@/lib/records";
import { ArrowDownTrayIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const DEFAULT_MIN_WORDS = 500;

const VarietyUnicityChart = dynamic(() => import("./VarietyUnicityChart"), {
    ssr: false,
    loading: () => <div className="flex min-h-[70vh] items-center justify-center text-sm text-neutral-500">Loading graph…</div>,
});

export default function GraphsTab({ players }: { players: OpenMonitoringPlayer[] }) {
    const [query, setQuery] = useState("");
    const [minWords, setMinWords] = useState(DEFAULT_MIN_WORDS);

    const filteredPlayers = useMemo(() => {
        return players.filter((player) => player.wordsPlaced >= minWords);
    }, [minWords, players]);

    const uniqueFilteredPlayers = useMemo(() => {
        return new Set(filteredPlayers.map((player) => player.accountName)).size;
    }, [filteredPlayers]);

    const uniquePlayers = useMemo(() => {
        return new Set(players.map((player) => player.accountName)).size;
    }, [players]);

    const normalizedQuery = query.trim().toLowerCase();

    return (
        <div>
            <p className="max-w-3xl text-sm text-neutral-600">
                Each point is a player in one language — a player who plays several languages appears as several points.{" "}
                <strong className="font-semibold text-neutral-800">Variety</strong> is unique words they placed divided by words
                they placed. <strong className="font-semibold text-neutral-800">Unicity</strong> is words only they have placed in
                that language, divided by words they placed. Point size grows with words placed in that language (up to 10,000).
                Click a point to open that player&apos;s profile.
            </p>
            <div
                className="mt-3 flex max-w-3xl gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
                role="note"
            >
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <p>
                    A very high variety <strong className="font-semibold">and</strong> unicity (above 95%) is often a sign of
                    cheating and using random word selection algorithms.
                </p>
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {languageEnumSchema.options.map((language) => (
                    <li key={language} className="flex items-center gap-2 text-sm text-neutral-700">
                        <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: LANGUAGE_DOT_COLORS[language] }}
                            aria-hidden
                        />
                        <Flag language={language} className="size-4" />
                        {LANGUAGES_DATA[language].shortDisplayName}
                    </li>
                ))}
            </ul>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-neutral-600">
                    Search player
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Username or account name"
                        className="focus-visible:ring-primary-500/40 h-9 rounded-md border border-neutral-200 bg-white px-3 text-neutral-950 outline-none focus-visible:ring-2"
                    />
                </label>
                <label className="flex min-w-[16rem] flex-col gap-1 text-sm text-neutral-600">
                    Minimum words placed: {minWords.toLocaleString()}
                    <input
                        type="range"
                        min={100}
                        max={10_000}
                        value={minWords}
                        onChange={(event) => setMinWords(Number(event.target.value))}
                        className="accent-primary-600 h-9"
                    />
                </label>
                <Button
                    variant="primary-outline"
                    onClick={() =>
                        downloadJson(`birdbot-variety-unicity-${new Date().toISOString().slice(0, 10)}.json`, {
                            generatedAt: new Date().toISOString(),
                            metrics: {
                                variety: "distinctWords / wordsPlaced",
                                unicity: "exclusiveWords / wordsPlaced",
                            },
                            minWordsPlaced: minWords,
                            players: filteredPlayers,
                        })
                    }
                >
                    <ArrowDownTrayIcon />
                    Download JSON
                </Button>
            </div>

            <p className="mt-2 text-xs text-neutral-500">
                Showing {filteredPlayers.length.toLocaleString()} of {players.length.toLocaleString()} points (
                {uniqueFilteredPlayers.toLocaleString()} of {uniquePlayers.toLocaleString()} players)
            </p>

            {filteredPlayers.length === 0 ? (
                <div className="mt-8 flex min-h-[70vh] items-center justify-center text-center text-neutral-600">
                    <p>No players match the current filters.</p>
                </div>
            ) : (
                <div className="mt-4 min-h-[70vh] flex-1">
                    <VarietyUnicityChart players={filteredPlayers} searchQuery={normalizedQuery} />
                </div>
            )}
        </div>
    );
}
