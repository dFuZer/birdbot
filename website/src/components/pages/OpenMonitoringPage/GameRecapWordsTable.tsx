"use client";

import { GameWordRow, GameWordsPage, GameWordSubmitResult } from "@/lib/gameRecaps";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const ROW_HEIGHT = 40;
const PAGE_SIZE = 100;

const SUBMIT_RESULT_LABELS: Record<GameWordSubmitResult, string> = {
    success: "Success",
    failsPrompt: "Fails prompt",
    invalidWord: "Invalid",
    noText: "No text",
    alreadyUsed: "Already used",
    bombExploded: "Bomb",
};

async function fetchWords({
    gameId,
    cursor,
    playerId,
    successOnly,
}: {
    gameId: string;
    cursor?: string;
    playerId?: string;
    successOnly: boolean;
}): Promise<GameWordsPage> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(PAGE_SIZE));
    if (playerId) params.set("playerId", playerId);
    if (successOnly) params.set("successOnly", "1");

    const response = await fetch(`/api/games/${encodeURIComponent(gameId)}/words?${params.toString()}`);
    if (!response.ok) {
        throw new Error("Failed to fetch words");
    }
    return response.json();
}

const columnHelper = createColumnHelper<GameWordRow>();

const columns = [
    columnHelper.display({
        id: "index",
        header: "#",
        cell: (info) => info.row.index + 1,
        size: 64,
    }),
    columnHelper.accessor("createdAt", {
        header: "Time",
        cell: (info) =>
            new Date(info.getValue()).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }),
        size: 110,
    }),
    columnHelper.accessor("username", {
        header: "Player",
        cell: (info) => (
            <Link
                href={`/p/${encodeURIComponent(info.row.original.authId)}`}
                className="truncate font-medium hover:underline"
            >
                {info.getValue()}
            </Link>
        ),
        size: 160,
    }),
    columnHelper.accessor("word", {
        header: "Word",
        cell: (info) => <span className="font-mono">{info.getValue()}</span>,
        size: 180,
    }),
    columnHelper.accessor("prompt", {
        header: "Prompt",
        cell: (info) => <span className="font-mono text-neutral-600">{info.getValue()}</span>,
        size: 90,
    }),
    columnHelper.accessor("submitResult", {
        header: "Result",
        cell: (info) => {
            const result = info.getValue();
            return (
                <span className={result === "success" ? "text-primary-700" : "text-neutral-500"}>
                    {SUBMIT_RESULT_LABELS[result]}
                </span>
            );
        },
        size: 120,
    }),
    columnHelper.accessor("flip", {
        header: "Flip",
        cell: (info) => (info.getValue() ? "Yes" : ""),
        size: 60,
    }),
    columnHelper.accessor("durationMs", {
        header: "Duration",
        cell: (info) => (info.getValue() == null ? "—" : `${info.getValue()} ms`),
        size: 100,
    }),
    columnHelper.accessor("reactionMs", {
        header: "Reaction",
        cell: (info) => (info.getValue() == null ? "—" : `${info.getValue()} ms`),
        size: 100,
    }),
];

export default function GameRecapWordsTable({
    gameId,
    playerId,
    playerUsername,
    gameWordCount,
    initialPage,
}: {
    gameId: string;
    playerId: string;
    playerUsername: string;
    gameWordCount: number;
    initialPage: GameWordsPage;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [focusedOnly, setFocusedOnly] = useState(false);
    const [successOnly, setSuccessOnly] = useState(false);
    const filtersActive = focusedOnly || successOnly;

    const { data, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isPending } = useInfiniteQuery({
        queryKey: ["game-words", gameId, focusedOnly ? playerId : null, successOnly],
        queryFn: ({ pageParam }) =>
            fetchWords({
                gameId,
                cursor: pageParam,
                playerId: focusedOnly ? playerId : undefined,
                successOnly,
            }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialData: filtersActive
            ? undefined
            : {
                  pages: [initialPage],
                  pageParams: [undefined],
              },
    });

    const rows = useMemo(() => data?.pages.flatMap((page) => page.rows) ?? [], [data]);
    const totalCount = data?.pages[0]?.totalCount ?? (filtersActive ? rows.length : gameWordCount);

    const table = useReactTable({
        data: rows,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.id,
    });

    const tableRows = table.getRowModel().rows;

    const rowVirtualizer = useVirtualizer({
        count: tableRows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [focusedOnly, successOnly]);

    useEffect(() => {
        const lastVirtualRow = virtualRows[virtualRows.length - 1];
        if (!lastVirtualRow) {
            return;
        }

        const isNearBottom = lastVirtualRow.index >= rows.length - 30;
        if (isNearBottom && hasNextPage && !isFetching && !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, rows.length, virtualRows]);

    if (isPending && rows.length === 0) {
        return (
            <div className="mt-4">
                <WordFilters
                    playerUsername={playerUsername}
                    focusedOnly={focusedOnly}
                    successOnly={successOnly}
                    onFocusedOnlyChange={setFocusedOnly}
                    onSuccessOnlyChange={setSuccessOnly}
                />
                <p className="mt-6 text-sm text-neutral-500">Loading words…</p>
            </div>
        );
    }

    if (error && rows.length === 0) {
        return (
            <div className="mt-4">
                <WordFilters
                    playerUsername={playerUsername}
                    focusedOnly={focusedOnly}
                    successOnly={successOnly}
                    onFocusedOnlyChange={setFocusedOnly}
                    onSuccessOnlyChange={setSuccessOnly}
                />
                <p className="mt-6 text-sm text-neutral-600">Failed to load words.</p>
            </div>
        );
    }

    return (
        <div className="mt-4">
            <WordFilters
                playerUsername={playerUsername}
                focusedOnly={focusedOnly}
                successOnly={successOnly}
                onFocusedOnlyChange={setFocusedOnly}
                onSuccessOnlyChange={setSuccessOnly}
            />
            <div className="mt-4 mb-2 flex items-center justify-between text-sm text-neutral-600">
                <p>
                    Loaded {rows.length.toLocaleString()} of {totalCount.toLocaleString()} words
                </p>
                {isFetchingNextPage && <p>Loading more…</p>}
            </div>
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <div
                    className="grid items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 text-xs font-medium text-neutral-500"
                    style={{
                        height: ROW_HEIGHT,
                        gridTemplateColumns: columns.map((column) => `${column.size ?? 100}px`).join(" "),
                    }}
                >
                    {table.getHeaderGroups()[0]?.headers.map((header) => (
                        <div key={header.id} className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                    ))}
                </div>
                <div ref={scrollRef} className="h-[70vh] overflow-auto">
                    <div
                        style={{
                            height: rowVirtualizer.getTotalSize(),
                            position: "relative",
                            width: "100%",
                        }}
                    >
                        {virtualRows.map((virtualRow) => {
                            const row = tableRows[virtualRow.index];
                            if (!row) {
                                return null;
                            }

                            return (
                                <div
                                    key={row.id}
                                    className="absolute top-0 left-0 grid w-full items-center gap-2 border-b border-neutral-100 px-3 text-sm"
                                    style={{
                                        height: virtualRow.size,
                                        transform: `translateY(${virtualRow.start}px)`,
                                        gridTemplateColumns: columns.map((column) => `${column.size ?? 100}px`).join(" "),
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <div key={cell.id} className="min-w-0 truncate">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {!hasNextPage && rows.length > 0 && <p className="mt-2 text-center text-xs text-neutral-500">All words loaded.</p>}
        </div>
    );
}

function WordFilters({
    playerUsername,
    focusedOnly,
    successOnly,
    onFocusedOnlyChange,
    onSuccessOnlyChange,
}: {
    playerUsername: string;
    focusedOnly: boolean;
    successOnly: boolean;
    onFocusedOnlyChange: (value: boolean) => void;
    onSuccessOnlyChange: (value: boolean) => void;
}) {
    return (
        <div className="flex flex-wrap gap-4 text-sm text-neutral-700">
            <label className="inline-flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={focusedOnly}
                    onChange={(event) => onFocusedOnlyChange(event.target.checked)}
                    className="accent-primary-600 size-4"
                />
                Only {playerUsername}
            </label>
            <label className="inline-flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={successOnly}
                    onChange={(event) => onSuccessOnlyChange(event.target.checked)}
                    className="accent-primary-600 size-4"
                />
                Successful placements only
            </label>
        </div>
    );
}
