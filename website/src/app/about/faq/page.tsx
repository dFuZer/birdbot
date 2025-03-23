import FaqPage from "@/components/pages/AboutPage/FaqPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "FAQ",
    description: "Find answers to common questions about BirdBot.",
};

export default function Page() {
    return <FaqPage />;
}
