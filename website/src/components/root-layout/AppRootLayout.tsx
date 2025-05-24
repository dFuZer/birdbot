import JotaiProvider from "@/components/providers/JotaiProvider";
import Blobs from "@/components/root-layout/Blobs";
import LayoutFooter from "@/components/root-layout/LayoutFooter";
import LayoutHeader from "@/components/root-layout/LayoutHeader";
import PublicEnvironmentVariablesProvider from "../providers/PublicEnvironmentVariablesProvider";
import TanstackQueryProvider from "../providers/TanstackQueryProvider";
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
                    <TanstackQueryProvider>
                        <WatchRouteChangeWrapper>
                            <LayoutBody>
                                <LayoutHeader />
                                <Blobs />
                                <div className="relative flex-1 pt-[var(--header-height)]">{children}</div>
                                <LayoutFooter />
                            </LayoutBody>
                        </WatchRouteChangeWrapper>
                    </TanstackQueryProvider>
                </PublicEnvironmentVariablesProvider>
            </JotaiProvider>
        </html>
    );
}
