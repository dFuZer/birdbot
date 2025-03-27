import PlayPage, { IPlayPageData, IRoom } from "@/components/pages/PlayPage/PlayPage";
import { languageEnumSchema } from "@/lib/records";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Play",
    description: "Play against BirdBot in one of the available rooms.",
};

const sampleRoom: IRoom = {
    roomName: "Room Name",
    playerCount: 2,
    currentGameDuration: 10,
    roomCode: "123456",
    language: languageEnumSchema.Values.en,
};

const sampleRooms: IRoom[] = Array.from({ length: 10 }, (_, i) => ({
    ...sampleRoom,
    roomName: `This room name can be very long and should be truncated ${i + 1}`,
    roomCode: `${i + 1}`,
    playerCount: Math.floor(Math.random() * 10),
}));

const samplePageData: IPlayPageData = {
    rooms: sampleRooms,
};

export default function Page() {
    return <PlayPage pageData={samplePageData} />;
}
