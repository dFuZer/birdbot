import Link from "next/link";
import { katibehFont } from "@/app/fonts";
import BirdBotLogo from "~/public/icon.svg";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import BurgerMenu from "./BurgerMenu";
import { LINKS } from "@/lib/constants";
import ChangeLanguageButton from "./ChangeLanguageButton";

export default function LayoutHeader() {
    return (
        <header className="fixed z-50 flex h-[3.5rem] w-full items-center border-b border-neutral-200 bg-white/50 backdrop-blur-md">
            <div className="hidden w-full items-center justify-between gap-8 px-5 md:flex lg:px-20">
                <Link href="/" className="flex items-center gap-2">
                    <BirdBotLogo className="size-8" />
                    <span
                        className={`${katibehFont.className} text-primary-700 h-8 align-middle text-[2.5rem] leading-4 tracking-tight lowercase`}
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
                    <ChangeLanguageButton />
                    <Button className="flex min-w-48 items-center justify-between" variant={"outline"}>
                        <span className="font-light text-neutral-400">Rechercher</span>
                        <MagnifyingGlassIcon className="h-5 w-5 text-neutral-700" />
                    </Button>
                </div>
            </div>
            <div className="flex w-full items-center justify-between px-8 md:hidden">
                <BurgerMenu />
                <div className="flex-1 px-8">
                    <Button className="flex w-full items-center justify-between gap-4" variant={"outline"}>
                        <span className="font-light text-neutral-400">Rechercher</span>
                        <MagnifyingGlassIcon className="h-5 w-5 text-neutral-700" />
                    </Button>
                </div>
                <ChangeLanguageButton />
                <Link href="/" className="ml-4 flex items-center gap-2">
                    <BirdBotLogo className="size-8 min-h-max min-w-max" />
                    <span
                        className={`${katibehFont.className} text-primary-700 hidden h-8 align-middle text-[2.5rem] leading-4 tracking-tight lowercase sm:inline`}
                    >
                        BirdBot
                    </span>
                </Link>
            </div>
        </header>
    );
}
