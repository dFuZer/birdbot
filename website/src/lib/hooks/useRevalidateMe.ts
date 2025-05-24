import { useQueryClient } from "@tanstack/react-query";

export default function useRevalidateMe() {
    const queryClient = useQueryClient();

    return async () => {
        await queryClient.invalidateQueries({ queryKey: ["me"] });
    };
}
