import { katibehFont } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import { type LanguageEnum } from "@/lib/records";
import { ClockIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import FrenchFlag from "~/public/frenchFlag.svg";

export interface IRoom {
    roomName: string;
    playerCount: number;
    currentGameDuration: number;
    roomCode: string;
    language: LanguageEnum;
}

export type IPlayPageData = {
    rooms: IRoom[];
};

function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function RoomCard({ room }: { room: IRoom }) {
    return (
        <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 truncate">
                    <span>
                        <FrenchFlag className="h-4 w-4" />
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
                    <span>{formatDuration(room.currentGameDuration)}</span>
                </div>
                <Button size="sm" variant="primary">
                    Join
                </Button>
            </div>
        </div>
    );
}

export default function PlayPage({ pageData }: { pageData: IPlayPageData }) {
    return (
        <div className="adaptivePadding my-20">
            <h1 className={`${katibehFont.className} text-center text-6xl leading-14`}>Come play with BirdBot!</h1>
            <p className="mt-5 text-center text-neutral-700">You can join any room here to play with BirdBot.</p>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pageData.rooms.map((room) => (
                    <RoomCard key={room.roomCode} room={room} />
                ))}
            </div>
        </div>
    );
}
