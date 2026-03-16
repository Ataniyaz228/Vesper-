/**
 * Robust cleaning for YouTube titles to remove clutter and metadata junk.
 */
export function cleanTrackTitle(title: string): string {
    return title
        // Remove common suffixes in parentheses or brackets
        .replace(/\((Official|Lyric|Lyrics|Video|Music Video|Audio|HD|4K|Remastered|Remix|Cover|Version|Film|Long Version|Out Now|Official Audio|Official Music Video|Official Lyric Video|Original Mix|Full MV|Prod\.? by .*?)\)/gi, "")
        .replace(/\[(Official|Lyric|Lyrics|Video|Music Video|Audio|HD|4K|Remastered|Remix|Cover|Version|Film|Long Version|Out Now|Official Audio|Official Music Video|Official Lyric Video|Original Mix|Full MV|Prod\.? by .*?)\]/gi, "")
        // Remove common standalone clutter
        .replace(/\s(Official Video|Official Audio|Official Music Video|Lyric Video|Lyric|Lyrics|Music Video|Audio|HD|4K|1080p|Full HD|Lyrics Video|FULL MV|Visualizer)\s/gi, " ")
        .replace(/\|.*/g, "") // Remove everything after a pipe
        .replace(/#\w+/g, "") // Remove hashtags
        // Clean up dashes/hyphens that are clearly junk
        .replace(/- (Official Video|Official Audio|Music Video|Lyric Video|Lyrics|Visualizer).*/gi, "")
        // Handle "feat." and "ft." - usually we want to keep them for searching but clean them up
        .replace(/\(feat\..*?\)/gi, "")
        .replace(/\[feat\..*?\]/gi, "")
        .replace(/\s[\[\(\]\]]?ft\..*/gi, "")
        .replace(/\s[\[\(\]\]]?feat\..*/gi, "")
        // Remove double spaces and trim
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Tries to extract a clean artist and title from a YouTube-style string.
 * Often YouTube titles are "Artist - Title" and channel name is "Artist - Topic".
 */
export function getCleanMetadata(rawTitle: string, channelTitle: string) {
    let cleanArtist = channelTitle.replace(/\s*-\s*Topic/gi, "").trim();
    let cleanTitle = cleanTrackTitle(rawTitle);

    // If title contains a hyphen, it's likely "Artist - Title"
    if (cleanTitle.includes(" - ")) {
        const parts = cleanTitle.split(" - ");
        if (parts.length >= 2) {
            const potentialArtist = parts[0].trim();
            const potentialTitle = parts[1].trim();

            // If the potential artist from title matches channel title (or vice versa)
            // we have a high confidence match
            if (potentialArtist.toLowerCase() === cleanArtist.toLowerCase()) {
                cleanTitle = potentialTitle;
            } else {
                // If they don't match, the title's version of artist is often more accurate
                cleanArtist = potentialArtist;
                cleanTitle = potentialTitle;
            }
        }
    }

    return { title: cleanTitle, artist: cleanArtist };
}

/**
 * Fetches high-quality square cover art from iTunes Search API.
 */
export async function getITunesCoverArt(title: string, artist: string): Promise<string | null> {
    const { title: cleanTitle, artist: cleanArtist } = getCleanMetadata(title, artist);

    // We try multiple search strategies to maximize chance of match
    const queries = [
        `${cleanArtist} ${cleanTitle}`,
        cleanTitle
    ];

    for (const query of queries) {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Relax to 8s

            const response = await fetch(url, {
                next: { revalidate: 86400 }, // Cache for 24 hours
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) continue;

            const data = await response.json();

            if (data.resultCount > 0) {
                // artworkUrl100 -> 600x600bb for high-res
                return data.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
            }
        } catch (error: any) {
            // Silently fail for timeouts/aborts so we don't crash SSR/Next.js
            if (error.name === 'AbortError') {
                console.warn(`[iTunesArt] Request timed out for: ${query}`);
            } else {
                console.error("iTunes API error:", error);
            }
        }
    }

    return null;
}
