"use client";

import { Button } from "@/components/ui/button";
import { downloadJson } from "@/lib/downloadJson";
import { GameRecapExport } from "@/lib/gameRecaps";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function GameRecapDownloadButton({ recapId, username, diedAt }: { recapId: string; username: string; diedAt: string }) {
    const [isExporting, setIsExporting] = useState(false);

    async function downloadRecap() {
        setIsExporting(true);
        try {
            const response = await fetch(`/api/game-recaps/${encodeURIComponent(recapId)}/export`);
            if (!response.ok) {
                throw new Error("Failed to export game recap");
            }
            const json: GameRecapExport = await response.json();
            const date = diedAt.slice(0, 10);
            downloadJson(`birdbot-recap-${username}-${date}.json`, json);
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <Button variant="primary-outline" onClick={() => void downloadRecap()} disabled={isExporting}>
            <ArrowDownTrayIcon />
            {isExporting ? "Preparing JSON…" : "Download JSON"}
        </Button>
    );
}
