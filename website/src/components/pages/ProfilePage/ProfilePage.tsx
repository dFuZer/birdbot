"use client";

import CopyCommand from "@/components/ui/CopyCommand";
import OptionalImage from "@/components/ui/OptionalImage";
import { getAuthDataAction } from "@/lib/auth";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function MyProfilePage() {
    const {
        data: userData,
        isLoading: loading,
        isError: error,
    } = useQuery({
        queryKey: ["userData"],
        queryFn: () => {
            return getAuthDataAction();
        },
    });

    return (
        <div className="flex min-h-screen justify-center px-4 py-6 sm:py-10">
            <div className="relative flex-1 overflow-hidden pb-6 sm:max-w-4xl sm:rounded-xl sm:bg-white/70 sm:shadow-xl">
                <div className="bg-primary-600 h-25 w-full" />
                <div className="absolute left-1/2 size-25 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg">
                    <OptionalImage
                        src={userData?.websiteUserData.avatarUrl}
                        commonClasses="h-full w-full"
                        height={150}
                        width={150}
                        placeholderType="user"
                    />
                </div>
                <div className="mt-20">
                    {loading ? (
                        <div className="mt-30 flex items-center justify-center">
                            <ArrowPathIcon className="size-6 animate-spin text-neutral-950" />
                        </div>
                    ) : error ? (
                        <div className="flex h-full items-center justify-center">Error</div>
                    ) : userData!.playerData ? (
                        <>
                            <h2 className="text-center text-2xl font-bold">{userData!.playerData.username}</h2>
                            <div className="mx-auto mt-5 h-[2rem] w-[20rem] space-y-1">
                                <div className="flex items-center justify-between text-sm font-medium text-neutral-600">
                                    <p>
                                        Level <span className="text-neutral-950">{userData!.playerData.xp.level}</span>
                                    </p>
                                    <p className="text-xs font-normal">
                                        {userData!.playerData.xp.currentLevelXp} / {userData!.playerData.xp.totalLevelXp} xp
                                    </p>
                                </div>
                                <div className="h-2 rounded bg-neutral-100">
                                    <div
                                        className="bg-primary-500 h-2 rounded"
                                        style={{
                                            width: `${userData!.playerData.xp.percentageToNextLevel.toFixed(5)}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </>
                    ) : userData!.linkingToken ? (
                        <div className="mx-auto max-w-sm space-y-4">
                            <h2 className="text-center text-2xl font-bold">Linking your account</h2>
                            <p>1/ Copy the following command.</p>
                            <div className={`mt-4 flex justify-center gap-2`}>
                                <CopyCommand command={`/link ${userData!.linkingToken}`} />
                            </div>
                            <p>
                                2/ Paste it into the chat in one of the rooms in the{" "}
                                <Link className="text-primary-700 underline" target="_blank" href={"/play"}>
                                    Play
                                </Link>{" "}
                                tab.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p>
                                Error: You don&apos;t have a player account nor do you have a linking token. This should never
                                happen. Please reach out to us
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
