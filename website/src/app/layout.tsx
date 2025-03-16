import type { Metadata } from "next";
import "./globals.css";
import { interFont } from "./font";
import LayoutHeader from "@/components/layout/LayoutHeader";
import Blobs from "@/components/layout/Blobs";
import LayoutFooter from "@/components/layout/LayoutFooter";

export const metadata: Metadata = {
    title: "BirdBot",
    description: "BirdBot is a JKLM.fun BombParty bot.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`relative flex min-h-screen flex-col ${interFont.className}`}>
                <LayoutHeader />
                <Blobs />
                <div className="relative flex-1">{children}</div>
                <LayoutFooter />
            </body>
        </html>
    );
}
