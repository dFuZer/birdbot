"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const queryClient = new QueryClient();

export default function TanstackQueryProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
