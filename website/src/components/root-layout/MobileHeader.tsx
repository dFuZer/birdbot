"use client";

import { katibehFont } from "@/app/fonts";
import ChangeLanguageButton from "@/components/root-layout/ChangeLanguageButton";
import { Button } from "@/components/ui/button";
import { LINKS } from "@/constants";
import { Bars3Icon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { atom, useAtom } from "jotai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createRef, useEffect } from "react";
import BirdBotLogo from "~/public/icon.svg";

export const mobileHeaderOpenAtom = atom(false);

export default function MobileHeader() {
    const [open, setOpen] = useAtom(mobileHeaderOpenAtom);
    const location = usePathname();
    const firstLinkRef = createRef<HTMLAnchorElement>();

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
                <Button className="flex w-full items-center justify-between gap-4" variant={"outline"}>
                    <span className="font-light text-neutral-400">Rechercher</span>
                    <MagnifyingGlassIcon className="h-5 w-5 text-neutral-700" />
                </Button>
            </div>
            <ChangeLanguageButton />
            <Link onClick={(e) => closeIfSameLocation(e, "/")} href="/" className="ml-4 flex items-center gap-2">
                <BirdBotLogo className="size-8 min-h-max min-w-max" />
                <span
                    className={`${katibehFont.className} text-primary-700 hidden h-8 align-middle text-[2.5rem] leading-4 tracking-tight lowercase sm:inline`}
                >
                    BirdBot
                </span>
            </Link>
        </div>
    );
}
