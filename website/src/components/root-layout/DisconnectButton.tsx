"use client";

import { disconnectAction } from "@/lib/auth";
import useRevalidateMe from "@/lib/hooks/useRevalidateMe";
import { cn } from "@/lib/tailwindUtils";
import { Button, ButtonProps } from "../ui/button";

export default function DisconnectButton({ className, variant, ...props }: Omit<ButtonProps, "onClick">) {
    const revalidateMe = useRevalidateMe();
    const onClick = async () => {
        await disconnectAction();
        revalidateMe();
    };

    return (
        <Button onClick={onClick} {...props} variant={variant || "ghost"} className={cn("w-full", className)}>
            Disconnect
        </Button>
    );
}
