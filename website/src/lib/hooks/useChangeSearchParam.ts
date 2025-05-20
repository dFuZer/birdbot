import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function useChangeSearchParam({ scroll = true }: { scroll?: boolean } = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    function changeSearchParam(changedParams: Record<string, string | null>) {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(changedParams).forEach(([key, value]) => {
            if (!value) {
                currentParams.delete(key);
            } else {
                currentParams.set(key, value);
            }
        });
        const search = currentParams.toString();
        const query = search ? `?${search}` : "";

        router.push(`${pathname}${query}`, { scroll });
    }

    return changeSearchParam;
}
