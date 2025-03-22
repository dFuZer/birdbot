import { Provider } from "jotai";

export default function JotaiProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <Provider>{children}</Provider>;
}
