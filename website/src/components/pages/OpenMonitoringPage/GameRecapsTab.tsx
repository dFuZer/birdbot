"use client";

import Flag from "@/components/pages/common/Flag";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GameRecapSummary, GameRecapsPage } from "@/lib/gameRecaps";
import { GAME_MODES_DATA, getTimeDisplayFromMilliseconds, LANGUAGES_DATA, LanguageEnum, ModesEnum } from "@/lib/records";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type RecapSort = "newest" | "oldest" | "mostWords" | "fewestWords" | "longest" | "shortest";

const SORT_OPTIONS: { value: RecapSort; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "mostWords", label: "Most words" },
    { value: "fewestWords", label: "Fewest words" },
    { value: "longest", label: "Longest game" },
    { value: "shortest", label: "Shortest game" },
];

type RecapQuery = {
    q: string;
    language?: LanguageEnum;
    mode?: ModesEnum;
    minWords: number;
    sort: RecapSort;
};

function recapSearchParams(query: RecapQuery, extras?: Record<string, string>) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.language) params.set("language", query.language);
    if (query.mode) params.set("mode", query.mode);
    if (query.minWords > 0) params.set("minWords", String(query.minWords));
    params.set("sort", query.sort);
    if (extras) {
        for (const [key, value] of Object.entries(extras)) {
            params.set(key, value);
        }
    }
    return params;
}

function countActiveFilters(query: RecapQuery) {
    return [
        Boolean(query.q),
        Boolean(query.language),
        Boolean(query.mode),
        query.minWords > 0,
        query.sort !== "newest",
    ].filter(Boolean).length;
}

async function fetchRecaps({ query, cursor }: { query: RecapQuery; cursor?: string }): Promise<GameRecapsPage> {
    const params = recapSearchParams(query, { limit: "30", ...(cursor ? { cursor } : {}) });
    const response = await fetch(`/api/game-recaps?${params.toString()}`);
    if (!response.ok) {
        throw new Error("Failed to fetch game recaps");
    }
    return response.json();
}

export default function GameRecapsTab() {
    const [input, setInput] = useState("");
    const [minWordsInput, setMinWordsInput] = useState("0");
    const [language, setLanguage] = useState<LanguageEnum | "all">("all");
    const [mode, setMode] = useState<ModesEnum | "all">("all");
    const [sort, setSort] = useState<RecapSort>("newest");
    const [applied, setApplied] = useState<RecapQuery>({ q: "", minWords: 0, sort: "newest" });
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            const minWords = Math.max(0, Number(minWordsInput) || 0);
            setApplied({
                q: input.trim(),
                language: language === "all" ? undefined : language,
                mode: mode === "all" ? undefined : mode,
                minWords,
                sort,
            });
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [input, minWordsInput, language, mode, sort]);

    const { data, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isPending } = useInfiniteQuery({
        queryKey: ["game-recaps", applied],
        queryFn: ({ pageParam }) => fetchRecaps({ query: applied, cursor: pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

    const recaps = useMemo(() => data?.pages.flatMap((page) => page.recaps) ?? [], [data]);
    const activeFilterCount = countActiveFilters(applied);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasNextPage && !isFetching && !isFetchingNextPage) {
                    void fetchNextPage();
                }
            },
            { rootMargin: "400px" },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]);

    function resetFilters() {
        setInput("");
        setMinWordsInput("0");
        setLanguage("all");
        setMode("all");
        setSort("newest");
    }

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="max-w-3xl text-sm text-neutral-600">
                    Filter recaps by player, language, mode, and word count. Click a recap to see the full game summary and every
                    word played.
                </p>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="primary-outline" className="shrink-0">
                            <FunnelIcon />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="bg-primary-600 ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        align="end"
                        className="w-80 space-y-3 p-4"
                        onPointerDownOutside={(event) => {
                            const target = event.target as HTMLElement;
                            if (target.closest("[data-radix-select-content]")) {
                                event.preventDefault();
                            }
                        }}
                        onFocusOutside={(event) => {
                            const target = event.target as HTMLElement;
                            if (target.closest("[data-radix-select-content]")) {
                                event.preventDefault();
                            }
                        }}
                    >
                        <label className="flex flex-col gap-1 text-sm text-neutral-600">
                            Search player
                            <input
                                type="search"
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder="Username or account name"
                                className="focus-visible:ring-primary-500/40 h-9 rounded-md border border-neutral-200 bg-white px-3 text-neutral-950 outline-none focus-visible:ring-2"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-neutral-600">
                            Language
                            <Select value={language} onValueChange={(value) => setLanguage(value as LanguageEnum | "all")}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="All languages" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All languages</SelectItem>
                                    {Object.entries(LANGUAGES_DATA).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <Flag language={key as LanguageEnum} className="size-4" />
                                                <span>{value.displayName}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-neutral-600">
                            Mode
                            <Select value={mode} onValueChange={(value) => setMode(value as ModesEnum | "all")}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="All modes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All modes</SelectItem>
                                    {Object.entries(GAME_MODES_DATA).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            {value.displayName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-neutral-600">
                            Minimum words
                            <input
                                type="number"
                                min={0}
                                value={minWordsInput}
                                onChange={(event) => setMinWordsInput(event.target.value)}
                                className="focus-visible:ring-primary-500/40 h-9 rounded-md border border-neutral-200 bg-white px-3 text-neutral-950 outline-none focus-visible:ring-2"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-neutral-600">
                            Sort
                            <Select value={sort} onValueChange={(value) => setSort(value as RecapSort)}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SORT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </label>
                        <Button variant="ghost" className="w-full" onClick={resetFilters} disabled={activeFilterCount === 0}>
                            Reset filters
                        </Button>
                    </PopoverContent>
                </Popover>
            </div>

            {isPending ? (
                <p className="mt-8 text-sm text-neutral-500">Loading recaps…</p>
            ) : error ? (
                <p className="mt-8 text-sm text-neutral-600">Failed to load game recaps.</p>
            ) : recaps.length === 0 ? (
                <p className="mt-8 text-sm text-neutral-600">No recaps match these filters.</p>
            ) : (
                <div className="mt-6 space-y-2">
                    {recaps.map((recap) => (
                        <RecapRow key={recap.id} recap={recap} />
                    ))}
                    <div ref={sentinelRef} className="h-8" />
                    {isFetchingNextPage && <p className="py-2 text-center text-sm text-neutral-500">Loading more…</p>}
                    {!hasNextPage && <p className="py-2 text-center text-sm text-neutral-500">No more recaps.</p>}
                </div>
            )}
        </div>
    );
}

function RecapRow({ recap }: { recap: GameRecapSummary }) {
    const durationMs = recap.durationMs ?? Math.max(0, new Date(recap.diedAt).getTime() - new Date(recap.startedAt).getTime());

    return (
        <Link
            href={`/open-monitoring/recaps/${recap.id}`}
            className="grid grid-cols-1 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_8rem_8rem]"
        >
            <div className="min-w-0">
                <p className="truncate font-bold text-neutral-950">{recap.username}</p>
                <p className="truncate text-xs text-neutral-500">{recap.accountName}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Flag language={recap.language} className="h-4 w-4" />
                <span>{GAME_MODES_DATA[recap.mode].displayName}</span>
            </div>
            <p className="text-sm text-neutral-700">
                <span className="font-semibold text-neutral-950">{recap.wordsCount.toLocaleString()}</span> words
            </p>
            <p className="text-sm text-neutral-500">{getTimeDisplayFromMilliseconds(durationMs)}</p>
        </Link>
    );
}
