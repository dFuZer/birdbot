import Link from "next/link";
import LandingBird from "~/public/landingBird.svg";

export default function ErrorPage({ message }: { message: string }) {
    return (
        <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center gap-4 pb-[var(--header-height)]">
            <LandingBird className="size-[20rem]" />
            <div className="flex flex-col gap-8">
                <h2 className="text-2xl font-bold">{message}</h2>
                <Link href="/" className="underline">
                    Return Home
                </Link>
            </div>
        </div>
    );
}
