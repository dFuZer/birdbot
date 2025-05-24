"use client";

import { robotoMonoFont } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import { ClipboardDocumentCheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export default function CopyCommand({ command }: { command: string }) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(command);
        setIsCopied(true);
    };

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isCopied) {
            timeout = setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        }

        return () => {
            clearTimeout(timeout);
        };
    }, [isCopied]);

    const handleSelectText = () => {
        const text = document.getElementById("command-text");
        if (text) {
            (text as HTMLInputElement).select();
        }
    };

    return (
        <div className="flex w-full cursor-text items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white shadow">
            <input
                className={`flex-1 truncate px-3 py-1 font-semibold focus:outline-0 ${robotoMonoFont.className}`}
                readOnly
                type="text"
                id="command-text"
                onClick={handleSelectText}
                value={command}
            />
            <TooltipProvider>
                <Tooltip open={isCopied}>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleCopy}>
                            {isCopied ? (
                                <ClipboardDocumentCheckIcon className="h-3 w-3" />
                            ) : (
                                <ClipboardDocumentIcon className="h-3 w-3" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{isCopied ? "Copied to clipboard" : "Copy to clipboard"}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
