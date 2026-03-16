/**
 * lastfm.ts — Music Intelligence Service
 * Connects to Last.fm API to determine track genres/tags.
 * Includes a filter to strip out non-genre metadata.
 */

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

// Common non-genre tags to ignore
const BLACKLIST = new Set([
    "seen live", "favorites", "favourite", "cool", "amazing",
    "beautiful", "awesome", "love", "10/10", "guilty pleasure",
    "favorite", "best", "legendary", "masterpiece"
]);

export async function getGenreForArtist(artistName: string): Promise<string> {
    if (!LASTFM_API_KEY) {
        console.warn("[lastfm] Missing LASTFM_API_KEY. Defaulting to 'Unknown'.");
        return "Unknown";
    }

    try {
        const url = `${BASE_URL}?method=artist.getTopTags&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`;
        const response = await fetch(url);
        const data = await response.json();

        if (data?.toptags?.tag && Array.isArray(data.toptags.tag)) {
            // Find the top 3 tags that aren't on the blacklist
            const validTags = data.toptags.tag
                .filter((t: { name: string }) => {
                    const name = t.name.toLowerCase();
                    return !BLACKLIST.has(name) && name.length > 2 && name.length < 20;
                })
                .slice(0, 3) // Get TOP 3
                .map((t: { name: string }) => {
                    return t.name.split(' ').map((word: string) =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                });

            if (validTags.length > 0) {
                return validTags.join(", "); // Return as "Genre 1, Genre 2, Genre 3"
            }
        }

        return "Alternative"; // Generic fallback if no specific tags found
    } catch (error) {
        console.error("[lastfm] Error fetching tags:", error);
        return "Unknown";
    }
}
