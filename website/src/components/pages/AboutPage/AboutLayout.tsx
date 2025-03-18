export default function AboutLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div>about layout</div>
            {children}
        </>
    );
}
