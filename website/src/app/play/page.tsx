import PlayPage, { IPlayPageData, IRoom } from "@/components/pages/PlayPage/PlayPage";
import { LanguagesEnum } from "@/records";

const sampleRoom: IRoom = {
    roomName: "",
    playerCount: 2,
    currentGameDuration: 10,
    roomCode: "123456",
    language: LanguagesEnum.ENGLISH,
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
