import MyProfilePage from "@/components/pages/ProfilePage/ProfilePage";
import { getAuthDataAction } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
    const userData = await getAuthDataAction();

    if (!userData) {
        return redirect("/");
    }

    return <MyProfilePage />;
}
