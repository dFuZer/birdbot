import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function useChangeSearchParam() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    function changeSearchParam(key: string, value: string | null) {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        if (!value) {
            currentParams.delete(key);
        } else {
            currentParams.set(key, value);
        }
        const search = currentParams.toString();
        const query = search ? `?${search}` : "";

        router.push(`${pathname}${query}`);
    }

    return changeSearchParam;
}
