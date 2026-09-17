"use client";

import { ScatterChart } from "echarts/charts";
import { DataZoomComponent, GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { ECElementEvent, ECharts, EChartsCoreOption } from "echarts/core";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import type { OpenMonitoringPlayer } from "@/app/open-monitoring/page";

echarts.use([ScatterChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

type ScatterDatum = {
    value: [number, number];
    accountName: string;
    username: string;
    wordsPlaced: number;
    distinctWords: number;
    exclusiveWords: number;
    highlighted: boolean;
};

function formatRatio(value: number) {
    return value.toFixed(3);
}

function escapeHtml(value: string) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default function VarietyUnicityChart({ players, searchQuery }: { players: OpenMonitoringPlayer[]; searchQuery: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ECharts | null>(null);
    const router = useRouter();

    const data = useMemo<ScatterDatum[]>(() => {
        return players.map((player) => {
            const haystack = `${player.username} ${player.accountName}`.toLowerCase();
            return {
                value: [player.variety, player.unicity],
                accountName: player.accountName,
                username: player.username,
                wordsPlaced: player.wordsPlaced,
                distinctWords: player.distinctWords,
                exclusiveWords: player.exclusiveWords,
                highlighted: searchQuery.length > 0 && haystack.includes(searchQuery),
            };
        });
    }, [players, searchQuery]);

    const option = useMemo<EChartsCoreOption>(() => {
        const hasSearch = searchQuery.length > 0;

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
                    symbolSize: (_value: number[], params: { data: ScatterDatum }) => {
                        if (params.data.highlighted) {
                            return 14;
                        }
                        return hasSearch ? 6 : 8;
                    },
                    itemStyle: {
                        color: (params: { data: ScatterDatum }) => {
                            if (params.data.highlighted) {
                                return "#058078";
                            }
                            return hasSearch ? "rgba(163, 163, 163, 0.35)" : "rgba(4, 200, 180, 0.7)";
                        },
                    },
                    emphasis: {
                        scale: 1.4,
                        itemStyle: {
                            color: "#058078",
                            borderColor: "#003333",
                            borderWidth: 1,
                        },
                    },
                },
            ],
        };
    }, [data, searchQuery]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const chart = echarts.init(container);
        chartRef.current = chart;

        const onClick = (params: ECElementEvent) => {
            const datum = params.data as ScatterDatum | undefined;
            if (!datum?.accountName) {
                return;
            }
            router.push(`/p/${encodeURIComponent(datum.accountName)}`);
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
