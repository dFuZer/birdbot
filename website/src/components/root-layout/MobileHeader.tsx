"use client";

import { LINKS } from "@/lib/links";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { atom, useAtom } from "jotai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createRef, useEffect } from "react";
import AuthButton from "./AuthButton";

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
                className={`absolute top-0 left-0 -z-1 flex h-screen w-full flex-col overflow-hidden bg-neutral-50 py-2 pt-[calc(var(--header-height)-1px)] ${open ? "visible" : "invisible"}`}
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
            <div className="flex min-w-[6rem] flex-1 justify-end">
                <AuthButton />
            </div>
        </div>
    );
}
