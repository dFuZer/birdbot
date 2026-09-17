"use client";

import { usePathname } from "next/navigation";

export default function Blobs() {
    const pathname = usePathname();

    return <div aria-hidden className={`ambient-background ${pathname === "/" ? "ambient-background--landing" : ""}`} />;
}
