"use client";

import { usePathname } from "next/navigation";

export default function Blobs() {
    let pathname = usePathname();
    if (pathname !== "/") return <></>;
    return (
        <div className="absolute top-0 right-0 left-0 -z-10 h-full overflow-hidden">
            <div className="mt-[50rem] flex w-full justify-between px-[6rem]">
                <div className="bg-highlight-500/80 h-32 w-[20rem] blur-[180px]"></div>
                <div className="bg-primary-500/80 mt-32 h-32 w-[20rem] blur-[180px]"></div>
            </div>
            <div className="mt-[35rem] flex w-full justify-between px-[6rem]">
                <div className="bg-primary-500/80 mt-32 h-32 w-[20rem] blur-[180px]"></div>
                <div className="bg-highlight-500/80 h-32 w-[20rem] blur-[180px]"></div>
            </div>
            <div className="mt-[32rem] flex w-full justify-between px-[6rem]">
                <div className="bg-highlight-500/80 h-32 w-[20rem] blur-[180px]"></div>
                <div className="bg-primary-500/80 mt-32 h-32 w-[20rem] blur-[180px]"></div>
            </div>
        </div>
    );
}
