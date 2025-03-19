"use client";

import { LINKS } from "@/lib/constants";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createRef, useEffect, useState } from "react";

export default function BurgerMenu() {
    let [open, setOpen] = useState(false);
    const location = usePathname();
    const firstLinkRef = createRef<HTMLAnchorElement>();

    function close() {
        if (open) setOpen(false);
    }

    function invertOpen() {
        setOpen((prev) => !prev);
    }

    function closeIfSameLocation(href: string) {
        if (location === href) {
            close();
        }
    }

    useEffect(() => {
        if (open) close();
    }, [location]);

    useEffect(() => {
        if (open) {
            firstLinkRef.current?.focus();
        }
    }, [open]);

    return (
        <>
            <button onClick={invertOpen} className="flex h-8 w-8 items-center justify-center">
                {open ? (
                    <XMarkIcon className="size-8 min-h-max min-w-max" />
                ) : (
                    <Bars3Icon className="size-8 min-h-max min-w-max" />
                )}
            </button>
            <div
                className={`absolute top-[3.5rem] left-0 h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-neutral-950 transition-all duration-350 ${open ? "opacity-20" : "opacity-0"}`}
            ></div>
            <div
                className={`absolute top-[3.5rem] left-0 w-full overflow-hidden bg-neutral-50 transition-all duration-350 ${open ? "h-[calc(100vh-3.5rem)]" : "h-0"}`}
            >
                <div className="space-y-1 py-2">
                    {LINKS.map((link, index) => (
                        <Link
                            ref={index === 0 ? firstLinkRef : undefined}
                            key={link.href}
                            tabIndex={open ? 0 : -1}
                            role="menuitem"
                            onClick={() => closeIfSameLocation(link.href)}
                            className="mx-2 flex items-center rounded-full px-8 py-3 font-semibold hover:bg-neutral-200"
                            href={link.href}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}
