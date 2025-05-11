"use client";

import { LINKS } from "@/lib/links";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { atom, useAtom } from "jotai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createRef, useContext, useEffect } from "react";
import BirdBotLogo from "~/public/icon.svg";
import { PublicEnvironmentVariablesContext } from "../providers/PublicEnvironmentVariablesProvider";
import DiscordLoginLink from "./DiscordLoginLink";

export const mobileHeaderOpenAtom = atom(false);

export default function MobileHeader() {
    const [open, setOpen] = useAtom(mobileHeaderOpenAtom);
    const location = usePathname();
    const firstLinkRef = createRef<HTMLAnchorElement>();
    const { EXPERIMENTAL_FEATURES_ENABLED } = useContext(PublicEnvironmentVariablesContext);

    function invertOpen() {
        setOpen((prev) => !prev);
    }

    function closeIfSameLocation(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
        if (location === href && open) {
            event.preventDefault();
            setOpen(false);
        }
    }

    useEffect(() => {
        if (open) {
            firstLinkRef.current?.focus();
        }
    }, [open, firstLinkRef]);

    return (
        <div className="flex w-full items-center justify-between px-8 md:hidden">
            <button onClick={invertOpen} className="flex h-8 w-8 items-center justify-center">
                {open ? (
                    <XMarkIcon className="size-8 min-h-max min-w-max" />
                ) : (
                    <Bars3Icon className="size-8 min-h-max min-w-max" />
                )}
            </button>
            <div
                className={`absolute top-0 left-0 -z-1 flex h-screen w-full flex-col overflow-hidden bg-neutral-50 py-2 pt-[calc(3.5rem-1px)] ${open ? "visible" : "invisible"}`}
            >
                <div className="h-[1px] bg-neutral-200"></div>
                {LINKS.map((link, index) => (
                    <Link
                        ref={index === 0 ? firstLinkRef : undefined}
                        key={link.href}
                        tabIndex={open ? 0 : -1}
                        role="menuitem"
                        onClick={(e) => {
                            closeIfSameLocation(e, link.href);
                        }}
                        className="mx-2 rounded-full px-8 py-3 font-semibold hover:bg-neutral-200"
                        href={link.href}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
            <div className="flex-1 px-8">
                {/* <Button className="flex w-full items-center justify-between gap-4" variant={"outline"}>
                    <span className="w-2/3 truncate text-left font-light text-neutral-400">Search on the website</span>
                    <MagnifyingGlassIcon className="h-5 w-5 text-neutral-700" />
                </Button> */}
            </div>
            {EXPERIMENTAL_FEATURES_ENABLED && <DiscordLoginLink />}
            <Link onClick={(e) => closeIfSameLocation(e, "/")} href="/" className="ml-4">
                <BirdBotLogo className="size-8 min-h-max min-w-max" />
            </Link>
        </div>
    );
}
