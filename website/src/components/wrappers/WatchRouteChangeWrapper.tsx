"use client";

import { mobileHeaderOpenAtom } from "@/components/root-layout/MobileHeader";
import { useAtom } from "jotai";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function WatchRouteChangeWrapper({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [, setOpen] = useAtom(mobileHeaderOpenAtom);
    const location = usePathname();

    useEffect(() => {
        setOpen(false);
        console.log("location changed", location);
    }, [location, setOpen]);

    return children;
}
