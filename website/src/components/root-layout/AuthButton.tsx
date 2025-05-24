"use client";

import useMeQuery from "@/lib/hooks/useMeQuery";
import DiscordLoginLink from "./DiscordLoginLink";
import UserPopover from "./UserPopover";

export default function AuthButton() {
    const userDataQuery = useMeQuery();

    const userData = userDataQuery.data;

    if (userDataQuery.isLoading || userDataQuery.isError) {
        return <></>;
    }

    return userData ? <UserPopover userData={userData} /> : <DiscordLoginLink />;
}
