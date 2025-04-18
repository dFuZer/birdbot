import { katibehFont } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import { DISCORD_LOGIN_LINK, LINKS } from "@/lib/links";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import BirdBotLogo from "~/public/icon.svg";
import MobileHeader from "./MobileHeader";
import { SiDiscord } from "@icons-pack/react-simple-icons";

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
                    <Button className="flex min-w-48 items-center justify-between" variant={"outline"}>
                        <span className="w-2/3 truncate text-left font-light text-neutral-400">Search on the website</span>
                        <MagnifyingGlassIcon className="h-5 w-5 text-neutral-700" />
                    </Button>
                    <Link href={DISCORD_LOGIN_LINK}>
                        <Button variant={"ghost"}>
                            <span>Log in</span>
                        </Button>
                    </Link>
                </div>
            </div>
            <MobileHeader />
        </header>
    );
}
