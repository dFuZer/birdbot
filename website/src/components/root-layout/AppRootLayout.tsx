import JotaiProvider from "@/components/providers/JotaiProvider";
import Blobs from "@/components/root-layout/Blobs";
import LayoutFooter from "@/components/root-layout/LayoutFooter";
import LayoutHeader from "@/components/root-layout/LayoutHeader";
import PublicEnvironmentVariablesProvider from "../providers/PublicEnvironmentVariablesProvider";
import WatchRouteChangeWrapper from "../wrappers/WatchRouteChangeWrapper";
import LayoutBody from "./LayoutBody";

export default function AppRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <JotaiProvider>
                <PublicEnvironmentVariablesProvider>
                    <WatchRouteChangeWrapper>
                        <LayoutBody>
                            <LayoutHeader />
                            <Blobs />
                            <div className="relative flex-1 pt-[3.5rem]">{children}</div>
                            <LayoutFooter />
                        </LayoutBody>
                    </WatchRouteChangeWrapper>
                </PublicEnvironmentVariablesProvider>
            </JotaiProvider>
        </html>
    );
}
