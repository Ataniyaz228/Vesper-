import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Cleans up track titles from generic YouTube suffixes
export function cleanTitle(raw: string): string {
    return raw
        .replace(/\(Official.*?\)/gi, "")
        .replace(/\[Official.*?\]/gi, "")
        .replace(/\(Audio\)/gi, "")
        .replace(/\[Audio\]/gi, "")
        .replace(/\(Lyric.*?\)/gi, "")
        .replace(/\[Lyric.*?\]/gi, "")
        .replace(/\|.*?$/, "") // Remove everything after a pipe
        .trim();
}

