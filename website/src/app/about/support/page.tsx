import SupportPage from "@/components/pages/AboutPage/SupportPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Support us",
    description: "Learn how you can support BirdBot and the development of the project.",
};

export default function Page() {
    return <SupportPage />;
}
