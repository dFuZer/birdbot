import AuthPage from "@/components/pages/AuthPage/AuthPage";
import { Suspense } from "react";

export default function Page() {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <AuthPage />
        </Suspense>
    );
}
