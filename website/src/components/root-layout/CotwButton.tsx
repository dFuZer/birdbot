import { CURRENT_WEEKLY_CHALLENGE_HREF } from "@/lib/weeklyChallenges";
import { cn } from "@/lib/tailwindUtils";
import { TrophyIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function CotwButton({ className, onClick }: { className?: string; onClick?: () => void }) {
    return (
        <Link
            href={CURRENT_WEEKLY_CHALLENGE_HREF}
            onClick={onClick}
            aria-label="Challenge of the Week"
            title="Challenge of the Week"
            className={cn(
                "bg-primary-600 hover:bg-primary-700 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-extrabold tracking-wider text-white shadow-md transition hover:scale-105 hover:shadow-lg",
                className,
            )}
        >
            <TrophyIcon className="size-4" aria-hidden="true" />
            COTW
        </Link>
    );
}
