"use client";

import { buttonVariants } from "@/components/ui/button";
import { IMyPlayerProfileData } from "@/lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import DisconnectButton from "./DisconnectButton";

export default function UserPopover({ userData }: { userData: IMyPlayerProfileData }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <Popover open={open} onOpenChange={(open) => setOpen(open)}>
            <PopoverTrigger asChild>
                <button>
                    <Avatar>
                        <AvatarImage src={userData.websiteUserData.avatarUrl} />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                </button>
            </PopoverTrigger>
            <PopoverContent collisionPadding={20} className="w-56 p-0">
                <p className="m-3 text-sm font-medium">
                    Logged in as <span className="font-bold">{userData.websiteUserData.globalName}</span>
                </p>
                <Separator />
                <div className="p-3">
                    <Link
                        onClick={() => setOpen(false)}
                        className={buttonVariants({ variant: "ghost", class: "w-full" })}
                        href={`/profile`}
                    >
                        My profile
                    </Link>
                    <DisconnectButton className="w-full" />
                </div>
            </PopoverContent>
        </Popover>
    );
}
