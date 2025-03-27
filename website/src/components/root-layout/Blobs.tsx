"use client";

import { usePathname } from "next/navigation";

export default function Blobs() {
    const pathname = usePathname();
    if (pathname !== "/")
        return (
            <div className="absolute top-0 right-0 left-0 -z-10 hidden h-full overflow-hidden sm:block">
                <div className="mt-[20rem] flex w-full justify-between px-[6rem]">
                    <div className="bg-primary-500 mt-32 h-40 w-[20vw] blur-[160px]"></div>
                    <div className="bg-highlight-500 h-40 w-[20vw] blur-[160px]"></div>
                </div>
            </div>
        );

    return (
        <div className="absolute top-0 right-0 left-0 -z-10 hidden h-full overflow-hidden sm:block">
            <div className="mt-[50rem] flex w-full justify-between px-[6rem]">
                <div className="bg-primary-500 mt-32 h-40 w-[20vw] blur-[160px]"></div>
                <div className="bg-highlight-500 h-40 w-[20vw] blur-[160px]"></div>
            </div>
            <div className="mt-[25rem] flex w-full justify-between px-[6rem]">
                <div className="bg-highlight-500/60 h-40 w-[20vw] blur-[160px]"></div>
                <div className="bg-primary-500/30 mt-32 h-40 w-[20vw] blur-[160px]"></div>
            </div>
            <div className="mt-[20rem] flex w-full justify-between px-[6rem]">
                <div className="bg-primary-500 h-40 w-[20vw] blur-[160px]"></div>
                <div className="bg-highlight-500 mt-30 h-40 w-[20vw] blur-[160px]"></div>
            </div>
        </div>
    );
}
