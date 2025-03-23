import CommandsPage from "@/components/pages/AboutPage/CommandsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Commands",
    description: "Learn about the commands available in BirdBot.",
};

export default function Page() {
    return <CommandsPage />;
}
