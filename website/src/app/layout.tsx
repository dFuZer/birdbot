import type { Metadata } from "next";
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
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
