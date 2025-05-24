"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useRevalidateMe from "@/lib/hooks/useRevalidateMe";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthPage() {
    const params = useSearchParams();
    const revalidateMe = useRevalidateMe();
    const router = useRouter();
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (sent) return;

        const code = params.get("code");

        if (!code) {
            setError("No code found");
            return;
        }

        fetch("/api/get-session-from-discord-code", {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ code }),
        })
            .then((res) => {
                if (res.ok) {
                    return res.json();
                } else {
                    throw new Error("Failed to get session");
                }
            })
            .then(() => {
                return revalidateMe();
            })
            .then(() => {
                router.push("/profile");
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        setSent(true);
    }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center pb-[var(--header-height)]">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <span>Authenticating with Discord</span>
                        {loading && <ArrowPathIcon className="size-4 animate-spin" />}
                    </CardTitle>
                </CardHeader>
                {error && <CardContent>An error has occurred. Please try again.</CardContent>}
            </Card>
        </div>
    );
}
