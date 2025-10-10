"use client";

import { isChromiumAtom } from "@/lib/atoms";
import { useAtom } from "jotai";

export default function ConditionalLandingBlob() {
    const [isChromium] = useAtom(isChromiumAtom);

    if (isChromium === null || !isChromium) {
        return <></>;
    }

    return (
        <div className="bg-primary-500 absolute top-1/2 left-1/2 h-40 w-[25rem] -translate-x-1/2 -translate-y-1/2 blur-[180px] lg:left-10 lg:translate-x-0"></div>
    );
}
