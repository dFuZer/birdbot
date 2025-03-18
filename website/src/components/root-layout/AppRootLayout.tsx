import { interFont } from "@/app/fonts";
import LayoutHeader from "@/components/root-layout/LayoutHeader";
import Blobs from "@/components/root-layout/Blobs";
import LayoutFooter from "@/components/root-layout/LayoutFooter";

export default function AppRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`relative flex min-h-screen flex-col bg-neutral-50 ${interFont.className}`}>
                <LayoutHeader />
                <Blobs />
                <div className="relative flex-1 pt-[3.5rem]">{children}</div>
                <LayoutFooter />
            </body>
        </html>
    );
}
