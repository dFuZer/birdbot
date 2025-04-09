import AppRootLayout from "@/components/root-layout/AppRootLayout";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        template: "%s | BirdBot",
        default: "BirdBot",
    },
    description:
        "BirdBot is a Croco.games BombParty bot. It tracks the players records, provides tools to improve at the game, and extends the BombParty experience.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AppRootLayout>{children}</AppRootLayout>;
}
