import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// HTML entity decode table
const HTML_ENTITIES: Record<string, string> = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">",
    "&quot;": '"', "&#39;": "'", "&nbsp;": " ",
};

function decodeHTMLEntities(str: string): string {
    return str.replace(/&[a-z#0-9]+;/gi, (entity) =>
        HTML_ENTITIES[entity] ?? entity
    );
}

export function cleanTitle(raw: string): string {
    let title = raw
        // 1. Decode HTML entities first
        .replace(/&[a-z#0-9]+;/gi, (e) => HTML_ENTITIES[e] ?? e)
        // 2. Strip emoji
        .replace(/[\u{1F300}-\u{1FFFF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, "")
        // 3. Strip official suffixes in parens/brackets
        .replace(/\[(Official|Lyric|Audio|Video|HD|4K|MV|Visualizer|Prod\.?.*?)\]/gi, "")
        .replace(/\((Official|Lyric|Audio|Video|HD|4K|MV|Visualizer|Prod\.?.*?)\)/gi, "")
        // 4. Remove feat.
        .replace(/\(?feat\..*?\)?/gi, "")
        .replace(/\(?ft\..*?\)?/gi, "")
        // 5. Cut everything after pipe or slash 
        .replace(/[|/].*$/, "")
        // 6. Clean whitespace
        .replace(/\s+/g, " ")
        .trim();

    // 7. Remove annoying channel names at the end (e.g. "Song - ChannelName")
    const parts = title.split(" - ");
    if (parts.length > 1) {
        title = parts[0].trim();
    }

    // 8. Truncate to ~55 chars gracefully
    if (title.length > 55) {
        title = title.substring(0, 52).trim() + "...";
    }

    return title;
}
