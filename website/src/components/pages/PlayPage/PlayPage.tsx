"use client";

import { katibehFont } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import { LanguageEnum, ModesEnum, getTimeDisplayFromMilliseconds } from "@/lib/records";
import { ArrowPathIcon, ClockIcon, PlusCircleIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Flag from "../common/Flag";
import LanguageSelect from "../common/LanguageSelect";
import ModeSelect from "../common/ModeSelect";

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
            href={`https://jklm.fun/${room.roomCode}`}
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

function CreateRoomCard({ onRoomCreated }: { onRoomCreated: () => void }) {
    const [language, setLanguage] = useState<LanguageEnum>("en");
    const [mode, setMode] = useState<ModesEnum>("regular");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdRoomUrl, setCreatedRoomUrl] = useState<string | null>(null);

    async function createRoom() {
        setError(null);
        setCreatedRoomUrl(null);
        setIsCreating(true);

        try {
            const response = await fetch("/api/create-ephemeral-room", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language, mode }),
            });
            const payload = (await response.json().catch(() => null)) as { roomCode?: unknown; message?: unknown } | null;
            if (!response.ok || typeof payload?.roomCode !== "string") {
                throw new Error(
                    typeof payload?.message === "string" ? payload.message : "Unable to create a room. Please try again.",
                );
            }
            const roomUrl = `https://jklm.fun/${payload.roomCode}`;
            const roomTab = window.open(roomUrl, "_blank");
            if (roomTab) {
                roomTab.opener = null;
            } else {
                setCreatedRoomUrl(roomUrl);
                setError("The room was created, but the new tab was blocked.");
            }
            onRoomCreated();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Unable to create a room. Please try again.");
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <section className="border-primary-200 bg-primary-50/40 flex flex-col rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-2">
                <PlusCircleIcon className="text-primary-700 size-6" />
                <h2 className="text-lg font-semibold">Create a temporary room</h2>
            </div>
            <p className="mt-2 text-sm text-neutral-600">
                The room closes after 20 minutes without a game. Connect to JKLM.fun and type{" "}
                <span className="whitespace-nowrap">/b</span> to create permanent rooms.
            </p>
            <div className="mt-4 flex gap-2">
                <div className="min-w-0 flex-1 [&>button]:w-full">
                    <LanguageSelect language={language} onChangeLanguage={setLanguage} />
                </div>
                <div className="min-w-0 flex-1 [&>button]:w-full">
                    <ModeSelect mode={mode} onChangeMode={setMode} />
                </div>
            </div>
            <Button className="mt-4 w-full" variant="primary" disabled={isCreating} onClick={createRoom}>
                {isCreating ? (
                    <>
                        <ArrowPathIcon className="size-4 animate-spin" />
                        Creating room…
                    </>
                ) : (
                    "Create and open room"
                )}
            </Button>
            {error && (
                <p className="mt-3 text-sm text-red-700" role="alert">
                    {error}{" "}
                    {createdRoomUrl && (
                        <a className="font-semibold underline" href={createdRoomUrl} target="_blank" rel="noreferrer">
                            Open room
                        </a>
                    )}
                </p>
            )}
        </section>
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
        roomsLoaded: boolean;
        rooms: IRoom[];
    }>({
        isLoading: true,
        isError: false,
        roomsLoaded: false,
        rooms: [],
    });

    const refreshRooms = useCallback(() => {
        setState((prev) => ({ ...prev, isLoading: true }));
        void fetchRooms()
            .then((data) => {
                setState(() => ({ rooms: data, isError: false, isLoading: false, roomsLoaded: true }));
            })
            .catch(() => {
                setState(() => ({ isError: true, isLoading: false, roomsLoaded: false, rooms: [] }));
            });
    }, []);

    useEffect(() => {
        refreshRooms();
        const interval = setInterval(refreshRooms, 4000);
        return () => clearInterval(interval);
    }, [refreshRooms]);

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
            {state.isError && (
                <div className="text-center text-neutral-950">
                    <p>Error loading rooms. The bot may be down.</p>
                </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {!state.isError && state.rooms.map((room) => <RoomCard key={room.roomCode} room={room} />)}
                {state.roomsLoaded && <CreateRoomCard onRoomCreated={refreshRooms} />}
            </div>
        </div>
    );
}
