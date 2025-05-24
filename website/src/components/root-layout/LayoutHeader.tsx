import DesktopHeader from "@/components/root-layout/DesktopHeader";
import MobileHeader from "./MobileHeader";

export default function LayoutHeader() {
    return (
        <header className="fixed z-50 flex h-[var(--header-height)] w-full items-center border-b border-neutral-200 bg-white/50 backdrop-blur-md">
            <DesktopHeader />
            <MobileHeader />
        </header>
    );
}
