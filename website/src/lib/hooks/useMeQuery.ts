import { getAuthDataAction } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export default function useMeQuery() {
    return useQuery({
        queryKey: ["me"],
        queryFn: () => {
            return getAuthDataAction();
        },
    });
}
