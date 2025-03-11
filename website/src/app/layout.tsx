import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "BirdBot",
    description: "BirdBot is a JKLM.fun BombParty bot.",
};

function Blobs() {
    return (
        <div className="absolute top-0 right-0 left-0 -z-10 h-full overflow-hidden">
            <div className="mt-40 flex w-full justify-between px-[6rem]">
                <div className="bg-primary-500/80 mt-24 h-32 w-[20rem] blur-[180px]"></div>
                <div className="bg-highlight-500/80 h-32 w-[20rem] blur-[180px]"></div>
            </div>
            <div className="mt-[32rem] flex w-full justify-between px-[6rem]">
                <div className="bg-highlight-500/80 h-32 w-[20rem] blur-[180px]"></div>
                <div className="bg-primary-500/80 mt-32 h-32 w-[20rem] blur-[180px]"></div>
            </div>
            <div className="mt-[35rem] flex w-full justify-between px-[6rem]">
                <div className="bg-primary-500/80 mt-32 h-32 w-[20rem] blur-[180px]"></div>
                <div className="bg-highlight-500/80 h-32 w-[20rem] blur-[180px]"></div>
            </div>
        </div>
    );
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="relative min-h-screen">
                <header className="z-50 h-[4.2rem] border-b border-neutral-200 bg-white/20 backdrop-blur-xs">birdbfffffot</header>
                <Blobs />
                <div>{children}</div>
            </body>
        </html>
    );
}
