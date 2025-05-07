import { IPlayerProfileData } from "@/app/players/[id]/page";
export default function PlayerProfilePage({ playerData }: { playerData: IPlayerProfileData }) {
    return (
        <div className="flex min-h-screen justify-center px-4 py-6 sm:py-10">
            <div className="flex-1 overflow-hidden pb-6 sm:max-w-3xl sm:rounded-xl sm:bg-white/70 sm:shadow-xl">
                <div className="bg-primary-600 h-20 w-full" />
                <p>{playerData.foundUsername}</p>
                <p>{playerData.playerAccountName}</p>
                <p>{playerData.playerUsername}</p>
            </div>
        </div>
    );
}
