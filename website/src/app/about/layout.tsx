import AboutLayout from "@/components/pages/AboutPage/AboutLayout";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AboutLayout>{children}</AboutLayout>;
}
