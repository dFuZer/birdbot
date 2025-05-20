"use client";

import { katibehFont } from "@/app/fonts";
import { LanguageEnum, getTimeDisplayFromMilliseconds } from "@/lib/records";
import { ArrowPathIcon, ClockIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import Flag from "../common/Flag";

export interface IRoom {
    roomName: string;
    playerCount: number;
    currentGameDuration: number | "NOT-IN-GAME";
    roomCode: string;
    language: LanguageEnum | "UNKNOWN";
    wordCount: number;
}

export type IPlayPageData = {
    rooms: IRoom[];
};
function RoomCard({ room }: { room: IRoom }) {
    return (
        <Link
            href={`https://croco.games/${room.roomCode}`}
            className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 truncate">
                    <span>
                        <Flag language={room.language} className="h-4 w-4" />
                    </span>
                    <span className="truncate text-lg font-semibold">{room.roomName}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-nowrap text-neutral-600">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>{room.playerCount} players</span>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-neutral-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                        {room.currentGameDuration === "NOT-IN-GAME"
                            ? "Not in game"
                            : getTimeDisplayFromMilliseconds(room.currentGameDuration)}
                    </span>
                </div>
                {room.currentGameDuration !== "NOT-IN-GAME" && (
                    <p className="text-sm text-neutral-600">{room.wordCount} words placed</p>
                )}
            </div>
        </Link>
    );
}

const fetchRooms = async () => {
    const response = await fetch("/api/get-room-list", {
        method: "GET",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch rooms");
    }
    type IRoomResponse = {
        roomId: string;
        roomLanguage: LanguageEnum | "UNKNOWN";
        playerCount: number;
        gameTime: number | "NOT-IN-GAME";
        roomCode: string;
        roomName: string;
        wordCount: number;
    };
    const json = (await response.json()) as IRoomResponse[];

    return json.map((room) => ({
        roomName: room.roomName,
        playerCount: room.playerCount,
        currentGameDuration: room.gameTime,
        roomCode: room.roomCode,
        language: room.roomLanguage,
        wordCount: room.wordCount,
    }));
};

export default function PlayPage() {
    const [state, setState] = useState<{
        isLoading: boolean;
        isError: boolean;
        rooms: IRoom[];
    }>({
        isLoading: true,
        isError: false,
        rooms: [],
    });

    useEffect(() => {
        function refreshRooms() {
            setState((prev) => ({ ...prev, isLoading: true }));
            fetchRooms()
                .then((data) => {
                    setState(() => ({ rooms: data, isError: false, isLoading: false }));
                })
                .catch(() => {
                    setState(() => ({ isError: true, isLoading: false, rooms: [] }));
                });
        }
        refreshRooms();
        const interval = setInterval(refreshRooms, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="adaptivePadding my-20">
            <h1 className={`${katibehFont.className} text-center text-6xl leading-14`}>Come play with BirdBot!</h1>
            <p className="mt-5 text-center text-neutral-700">You can join any room here to play with BirdBot.</p>
            <div className="my-5 h-10">
                {state.isLoading && (
                    <div className="flex items-center justify-center">
                        <ArrowPathIcon className="size-6 animate-spin text-neutral-950" />
                    </div>
                )}
            </div>
            {state.isError ? (
                <div className="text-center text-neutral-950">
                    <p>Error loading rooms. The bot may be down.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {state.rooms.map((room) => (
                        <RoomCard key={room.roomCode} room={room} />
                    ))}
                </div>
            )}
        </div>
    );
}
