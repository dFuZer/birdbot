"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ABOUT_PAGE_LINKS } from "./AboutLayout";

export default function AboutPageMobileNavLinks() {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href;

    return ABOUT_PAGE_LINKS.map((link) => (
        <Link
            className={`flex flex-1 items-center gap-2 truncate rounded-md px-4 py-1 text-nowrap ${
                isActive(link.href) ? "bg-white shadow" : "bg-white/60"
            }`}
            href={link.href}
            key={link.href}
        >
            {link.icon}
            <span>{link.label}</span>
        </Link>
    ));
}
