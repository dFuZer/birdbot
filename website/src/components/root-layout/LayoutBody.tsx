"use client";

import { interFont } from "@/app/fonts";
import { mobileHeaderOpenAtom } from "@/components/root-layout/MobileHeader";
import { useAtomValue } from "jotai";

export default function LayoutBody({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const mobileHamburgerMenu = useAtomValue(mobileHeaderOpenAtom);

    return (
        <body
            className={`relative flex min-h-screen flex-col bg-neutral-50 ${interFont.className} ${mobileHamburgerMenu ? "overflow-hidden" : "overflow-y-auto"}`}
        >
            {children}
        </body>
    );
}
