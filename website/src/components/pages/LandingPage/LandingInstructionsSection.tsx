"use client";

import { katibehFont } from "@/app/font";
import { useEffect, useRef, useState } from "react";

type HoveredSection = null | 1 | 2 | 3;

function barClass(hoveredSection: HoveredSection) {
    if (hoveredSection === null) return `w-[0%] after:translate-x-0`;
    if (hoveredSection === 1) return `w-[33.333%] after:translate-x-1/2`;
    if (hoveredSection === 2) return `w-[66.666%] after:translate-x-1/2`;
    if (hoveredSection === 3) return `w-[100%] after:translate-x-full`;
}

function getCircleColorClass(circleNumber: number, hoveredSection: HoveredSection) {
    if (hoveredSection && hoveredSection >= circleNumber) return `bg-neutral-950`;
    return `bg-neutral-200`;
}

export default function LandingInstructionsSection() {
    let [hoveredSection, setHoveredSection] = useState<HoveredSection>(null);
    let divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentDiv = divRef.current;

        const handleMouseMove = (event: MouseEvent) => {
            if (!currentDiv) return;
            let x = event.clientX - currentDiv.getBoundingClientRect().left;
            if (x < currentDiv.clientWidth / 3) setHoveredSection(1);
            else if (x < (currentDiv.clientWidth / 3) * 2) setHoveredSection(2);
            else setHoveredSection(3);
        };

        const handleMouseLeave = () => {
            setHoveredSection(null);
        };

        if (currentDiv) {
            currentDiv.addEventListener("mousemove", handleMouseMove);
            currentDiv.addEventListener("mouseleave", handleMouseLeave);
        }

        return () => {
            if (currentDiv) {
                currentDiv.removeEventListener("mousemove", handleMouseMove);
                currentDiv.removeEventListener("mouseleave", handleMouseLeave);
            }
        };
    }, []);

    return (
        <div ref={divRef} className="adaptivePadding mt-30 flex flex-col justify-center py-10 text-center">
            <h2 className={`${katibehFont.className} text-center text-6xl leading-14`}>How it works</h2>
            <p className="mt-5 text-center text-neutral-700">Here how you can get started with BirdBot.</p>
            <div className="flex flex-col py-10">
                <div className="flex w-full items-center py-5">
                    <div className="w-1/3 px-3">
                        <h3 className="text-center text-lg leading-5 font-semibold md:text-2xl md:leading-7">
                            Create a BombParty Room
                            <br />
                            <span className="text-base font-medium text-neutral-700">(Optional)</span>
                        </h3>
                    </div>
                    <div className="w-1/3 px-3">
                        <h3 className="text-center text-lg leading-5 font-semibold md:text-2xl md:leading-7">Join the room</h3>
                    </div>
                    <div className="w-1/3 px-3">
                        <h3 className="text-center text-lg leading-5 font-semibold md:text-2xl md:leading-7">
                            Play and Level Up
                            <br />
                            your Gameplay
                        </h3>
                    </div>
                </div>
                <div className="flex w-full items-center py-5">
                    <div className="relative h-1 w-full">
                        <div className="absolute top-1/2 h-1 w-full overflow-hidden">
                            <div className="absolute top-0 left-0 h-full w-full bg-neutral-200"></div>
                            <div
                                className={`barTip absolute top-0 left-0 h-full bg-neutral-950 transition-all ${barClass(hoveredSection)}`}
                            ></div>
                        </div>
                        <div
                            className={`div absolute top-1/2 left-1/6 size-7 -translate-1/2 rounded-full transition-colors ${getCircleColorClass(1, hoveredSection)}`}
                        ></div>
                        <div
                            className={`div absolute top-1/2 left-3/6 size-7 -translate-1/2 rounded-full transition-colors ${getCircleColorClass(2, hoveredSection)}`}
                        ></div>
                        <div
                            className={`div absolute top-1/2 left-5/6 size-7 -translate-1/2 rounded-full transition-colors ${getCircleColorClass(3, hoveredSection)}`}
                        ></div>
                        <div
                            className={`div absolute top-1/2 left-1/6 size-[1.2rem] -translate-1/2 rounded-full bg-neutral-50`}
                        ></div>
                        <div
                            className={`div absolute top-1/2 left-3/6 size-[1.2rem] -translate-1/2 rounded-full bg-neutral-50`}
                        ></div>
                        <div
                            className={`div absolute top-1/2 left-5/6 size-[1.2rem] -translate-1/2 rounded-full bg-neutral-50`}
                        ></div>
                    </div>
                </div>
                <div className="flex w-full py-5">
                    <div className="w-1/3 px-3">
                        <p className="text-sm text-neutral-800 md:text-base">
                            By using /b in a BombParty room where BirdBot is present in the Play tab, it will create a room for
                            you. Note that you must be connected to use the /b command.
                        </p>
                    </div>
                    <div className="w-1/3 px-3">
                        <p className="text-sm text-neutral-800 md:text-base">
                            Join the room that the bot created for you or that you found in the Play tab
                            <br />
                            <br />
                            <span className="text-xs text-neutral-700 md:text-sm">
                                (While it is possible to use BirdBot without creating your own room, creating one will allow you
                                to customize it)
                            </span>
                        </p>
                    </div>
                    <div className="w-1/3 px-3">
                        <p className="text-sm text-neutral-800 md:text-base">
                            Once you are in a room with BirdBot, you can play against it, and use its full power and commands.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
