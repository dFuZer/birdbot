"use client";

import { ScatterChart } from "echarts/charts";
import { DataZoomComponent, GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { ECElementEvent, ECharts, EChartsCoreOption } from "echarts/core";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import type { OpenMonitoringPlayer } from "@/app/open-monitoring/page";
import { LANGUAGE_DOT_COLORS, LANGUAGES_DATA, type LanguageEnum } from "@/lib/records";

echarts.use([ScatterChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

const MAX_WORDS_FOR_SIZE = 10_000;
const MIN_SIZE_SCALE = 0.5;
const MAX_SIZE_SCALE = 1.5;

type ScatterDatum = {
    value: [number, number];
    authId: string;
    username: string;
    language: LanguageEnum;
    wordsPlaced: number;
    distinctWords: number;
    exclusiveWords: number;
    highlighted: boolean;
    symbolSize: number;
    itemStyle: {
        color: string;
        borderColor: string;
        borderWidth: number;
    };
};

function formatRatio(value: number) {
    return value.toFixed(3);
}

function escapeHtml(value: string) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function hexToRgba(hex: string, alpha: number) {
    const n = hex.replace("#", "");
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function symbolSizeForWords(baseSize: number, wordsPlaced: number) {
    const t = Math.min(Math.max(wordsPlaced / MAX_WORDS_FOR_SIZE, 0), 1);
    const scale = MIN_SIZE_SCALE + t * (MAX_SIZE_SCALE - MIN_SIZE_SCALE);
    return baseSize * scale;
}

export default function VarietyUnicityChart({ players, searchQuery }: { players: OpenMonitoringPlayer[]; searchQuery: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ECharts | null>(null);
    const router = useRouter();

    const data = useMemo<ScatterDatum[]>(() => {
        const hasSearch = searchQuery.length > 0;
        const points = players.map((player) => {
            const haystack = `${player.username} ${player.authId}`.toLowerCase();
            const highlighted = hasSearch && haystack.includes(searchQuery);
            const color = LANGUAGE_DOT_COLORS[player.language];
            const baseSize = highlighted ? 14 : hasSearch ? 6 : 8;

            return {
                value: [player.variety, player.unicity] as [number, number],
                authId: player.authId,
                username: player.username,
                language: player.language,
                wordsPlaced: player.wordsPlaced,
                distinctWords: player.distinctWords,
                exclusiveWords: player.exclusiveWords,
                highlighted,
                symbolSize: symbolSizeForWords(baseSize, player.wordsPlaced),
                itemStyle: {
                    color: highlighted ? color : hexToRgba(color, hasSearch ? 0.28 : 0.78),
                    borderColor: highlighted ? "#171717" : "transparent",
                    borderWidth: highlighted ? 1 : 0,
                },
            };
        });

        return points.sort((a, b) => Number(a.highlighted) - Number(b.highlighted));
    }, [players, searchQuery]);

    const option = useMemo<EChartsCoreOption>(() => {
        return {
            animation: false,
            grid: {
                left: 56,
                right: 24,
                top: 28,
                bottom: 48,
            },
            xAxis: {
                type: "value",
                min: 0,
                max: 1,
                name: "Variety",
                nameLocation: "middle",
                nameGap: 32,
                nameTextStyle: {
                    color: "#525252",
                    fontSize: 13,
                },
                axisLabel: {
                    color: "#737373",
                },
                splitLine: {
                    lineStyle: {
                        color: "#e5e5e5",
                    },
                },
            },
            yAxis: {
                type: "value",
                min: 0,
                max: 1,
                name: "Unicity",
                nameLocation: "middle",
                nameGap: 40,
                nameTextStyle: {
                    color: "#525252",
                    fontSize: 13,
                },
                axisLabel: {
                    color: "#737373",
                },
                splitLine: {
                    lineStyle: {
                        color: "#e5e5e5",
                    },
                },
            },
            tooltip: {
                trigger: "item",
                formatter: (params: unknown) => {
                    const datum = (params as { data: ScatterDatum }).data;
                    return [
                        `<strong>${escapeHtml(datum.username)}</strong>`,
                        `Language: ${escapeHtml(LANGUAGES_DATA[datum.language].displayName)}`,
                        `Variety: ${formatRatio(datum.value[0])}`,
                        `Unicity: ${formatRatio(datum.value[1])}`,
                        `Words placed: ${datum.wordsPlaced.toLocaleString()}`,
                        `Distinct: ${datum.distinctWords.toLocaleString()}`,
                        `Exclusive: ${datum.exclusiveWords.toLocaleString()}`,
                    ].join("<br/>");
                },
            },
            dataZoom: [
                { type: "inside", xAxisIndex: 0, filterMode: "none", zoomOnMouseWheel: false, moveOnMouseWheel: false },
                { type: "inside", yAxisIndex: 0, filterMode: "none", zoomOnMouseWheel: false, moveOnMouseWheel: false },
            ],
            series: [
                {
                    type: "scatter",
                    cursor: "pointer",
                    data,
                    emphasis: {
                        scale: 1.4,
                        itemStyle: {
                            borderColor: "#171717",
                            borderWidth: 1,
                        },
                    },
                },
            ],
        };
    }, [data]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const chart = echarts.init(container);
        chartRef.current = chart;

        const onClick = (params: ECElementEvent) => {
            const datum = params.data as ScatterDatum | undefined;
            if (!datum?.authId) {
                return;
            }
            router.push(`/p/${encodeURIComponent(datum.authId)}?l=${datum.language}`);
        };

        chart.on("click", onClick);

        const observer = new ResizeObserver(() => {
            chart.resize();
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
            chart.off("click", onClick);
            chart.dispose();
            chartRef.current = null;
        };
    }, [router]);

    useEffect(() => {
        chartRef.current?.setOption(option, { notMerge: true });
    }, [option]);

    return <div ref={containerRef} className="h-[70vh] w-full cursor-pointer" />;
}
