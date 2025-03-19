import LayoutHeader from "@/components/root-layout/LayoutHeader";
import Blobs from "@/components/root-layout/Blobs";
import LayoutFooter from "@/components/root-layout/LayoutFooter";
import LayoutBody from "./LayoutBody";

export default function AppRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <LayoutBody>
                <LayoutHeader />
                <Blobs />
                <div className="relative flex-1 pt-[3.5rem]">{children}</div>
                <LayoutFooter />
            </LayoutBody>
        </html>
    );
}
