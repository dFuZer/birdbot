import HistoryPage from "@/components/pages/AboutPage/HistoryPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "History",
    description: "Learn about the history of BirdBot.",
};

export default function Page() {
    return <HistoryPage />;
}
