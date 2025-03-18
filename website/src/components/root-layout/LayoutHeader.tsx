import Link from "next/link";
import { katibehFont } from "@/app/fonts";
import BirdBotLogo from "~/public/icon.svg";
import FrenchFlag from "~/public/frenchFlag.svg";
import { SunIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

export default function LayoutHeader() {
    return (
        <header className="fixed z-50 flex h-[3.5rem] w-full items-center border-b border-neutral-200 bg-white/50 backdrop-blur-md">
            <div className="adaptivePadding flex w-full items-center justify-between gap-10">
                <Link href="/" className="ml-6 flex items-center gap-2">
                    <BirdBotLogo className="size-8" />
                    <span
                        className={`${katibehFont.className} text-primary-700 h-8 align-middle text-[2.5rem] leading-4 tracking-tight lowercase`}
                    >
                        BirdBot
                    </span>
                </Link>
                <div className="flex items-center gap-1 font-normal">
                    <Link className="px-1.5" href={"/play"}>
                        Play
                    </Link>
                    <Link className="px-1.5" href={"/players"}>
                        Players
                    </Link>
                    <Link className="px-1.5" href={"/records"}>
                        Records
                    </Link>
                    <Link className="px-1.5" href={"/about"}>
                        About
                    </Link>
                </div>
                <div className="flex items-center gap-4 font-medium">
                    <SunIcon className="h-5 w-5 text-neutral-700" />
                    <Button
                        variant={"outline"}
                        className="flex h-7 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3"
                    >
                        <span className="text-sm font-bold">FR</span>
                        <FrenchFlag className="h-4 w-4" />
                    </Button>
                    <Button className="flex min-w-48 items-center justify-between" variant={"outline"}>
                        <span className="font-light text-neutral-400">Rechercher</span>
                        <MagnifyingGlassIcon className="h-5 w-5 text-neutral-700" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
