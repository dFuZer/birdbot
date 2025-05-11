import { katibehFont } from "@/app/fonts";
import { EXPERIMENTAL_FEATURES_ENABLED } from "@/lib/env";
import { LINKS } from "@/lib/links";
import Link from "next/link";
import BirdBotLogo from "~/public/icon.svg";
import DiscordLoginLink from "./DiscordLoginLink";
import MobileHeader from "./MobileHeader";

export default function LayoutHeader() {
    return (
        <header className="fixed z-50 flex h-[3.5rem] w-full items-center border-b border-neutral-200 bg-white/50 backdrop-blur-md">
            <div className="hidden w-full items-center justify-between gap-8 px-5 md:flex lg:px-20">
                <Link href="/" className="flex items-center gap-2">
                    <BirdBotLogo className="size-8" />
                    <span
                        className={`${katibehFont.className} text-primary-700 hidden h-8 align-middle text-[2.5rem] leading-4 tracking-tight lowercase lg:inline`}
                    >
                        BirdBot
                    </span>
                </Link>
                <div className="flex items-center gap-1 font-normal">
                    {LINKS.map((link) => (
                        <Link key={link.href} className="px-1.5" href={link.href}>
                            {link.label}
                        </Link>
                    ))}
                </div>
                <div className="flex items-center gap-4 font-medium">
                    {/* <SunIcon className="h-5 w-5 text-neutral-700" /> */}
                    {/* <Button className="flex min-w-48 items-center justify-between" variant={"outline"}>
                        <span className="w-2/3 truncate text-left font-light text-neutral-400">Search on the website</span>
                        <MagnifyingGlassIcon className="h-5 w-5 text-neutral-700" />
                    </Button> */}
                    {EXPERIMENTAL_FEATURES_ENABLED && <DiscordLoginLink />}
                </div>
            </div>
            <MobileHeader />
        </header>
    );
}
