import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type ISearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
