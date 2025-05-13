import PlayPage from "@/components/pages/PlayPage/PlayPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Play",
    description: "Play against BirdBot in one of the available rooms.",
};

export default function Page() {
    return <PlayPage />;
}
