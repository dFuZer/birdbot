import { katibehFont } from "@/app/fonts";
import { LINKS } from "@/lib/links";
import Link from "next/link";
import BirdBotLogo from "~/public/icon.svg";
import AuthButton from "./AuthButton";

export default async function DesktopHeader() {
    return (
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
            <div className="flex min-w-[6rem] items-center justify-end gap-4 font-medium">
                <AuthButton />
            </div>
        </div>
    );
}
