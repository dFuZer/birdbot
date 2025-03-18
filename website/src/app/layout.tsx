import type { Metadata } from "next";
import AppRootLayout from "@/components/root-layout/AppRootLayout";
import "./globals.css";

export const metadata: Metadata = {
    title: "BirdBot",
    description: "BirdBot is a JKLM.fun BombParty bot.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AppRootLayout>{children}</AppRootLayout>;
}
