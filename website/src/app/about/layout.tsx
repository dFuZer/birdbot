import AboutLayout from "@/components/pages/AboutPage/AboutLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        template: "%s | BirdBot",
        default: "About",
    },
    description: "Learn more about BirdBot.",
};

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AboutLayout>{children}</AboutLayout>;
}
