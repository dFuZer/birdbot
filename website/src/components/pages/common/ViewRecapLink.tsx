"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function ViewRecapLink({ recapId, className }: { recapId: string; className?: string }) {
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={`/open-monitoring/recaps/${recapId}`}
                        className={className}
                        aria-label="View game recap"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <span className="flex size-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-neutral-50 hover:text-neutral-950">
                            <ClipboardDocumentListIcon className="size-4" />
                        </span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>View game recap</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
