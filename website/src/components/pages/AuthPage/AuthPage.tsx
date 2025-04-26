"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthPage() {
    const params = useSearchParams();
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>(undefined);
    const [success, setSuccess] = useState(false);

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
            .then(() => {
                setSuccess(true);
            })
            .catch((err) => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });

        setSent(true);
    }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) return <div>callback processing...</div>;
    if (error) return <div>error: {error}</div>;
    if (success) return <div>success</div>;
}
