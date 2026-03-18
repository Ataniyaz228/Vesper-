import "server-only";
import { getCleanMetadata } from "./metadata";

// -----------------------------------------------------------------------------
// STRICT TYPESCRIPT INTERFACES
// -----------------------------------------------------------------------------
export interface Artist {
    id: string; // channelId
    name: string; // channelTitle
}

export interface Track {
    id: string; // videoId
    title: string;
    artist: string; // channelTitle
    durationMs: number; // YouTube search/playlist doesn't return duration natively without extra calls
    albumImageUrl?: string;
}

export interface Playlist {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    tracks: Track[];
}

export type Album = Playlist;
// Since YouTube doesn't have "Albums" in the traditional sense, 
// we will alias Playlist to Album to maintain our UI primitives' structure.

// -----------------------------------------------------------------------------
// YOUTUBE DATA API CONFIG
// -----------------------------------------------------------------------------
const getApiKeys = (): string[] => {
    // Load primary key and any backups (YOUTUBE_API_KEY_2, YOUTUBE_API_KEY_3, etc.)
    const keys = [];
    if (process.env.YOUTUBE_API_KEY) keys.push(process.env.YOUTUBE_API_KEY);
    if (process.env.YOUTUBE_API_KEY_2) keys.push(process.env.YOUTUBE_API_KEY_2);
    if (process.env.YOUTUBE_API_KEY_3) keys.push(process.env.YOUTUBE_API_KEY_3);

    if (keys.length === 0) {
        throw new Error("Missing YOUTUBE_API_KEY environment variable. Need at least one key.");
    }
    return keys;
};

const BASE_URL = "https://www.googleapis.com/youtube/v3";

// Maintain current working key index in memory (best-effort across hot reloads)
let currentKeyIndex = 0;

/**
 * Intelligent fetch wrapper that tries multiple API keys if the current one hits a Quota (403) or Rate Limit (429)
 */
async function fetchWithFallback(url: URL, init?: RequestInit): Promise<Response> {
    const keys = getApiKeys();
    let lastResponse: Response | null = null;

    for (let attempts = 0; attempts < keys.length; attempts++) {
        const testIndex = (currentKeyIndex + attempts) % keys.length;
        const testKey = keys[testIndex];

        // Attach the key we are testing
        url.searchParams.set("key", testKey);

        const response = await fetch(url.toString(), init);

        if (response.ok) {
            // Update global index so subsequent calls use this working key first
            if (currentKeyIndex !== testIndex) {
                console.info(`[YouTube API] Successfully switched to backup key at index ${testIndex}`);
                currentKeyIndex = testIndex;
            }
            return response;
        }

        if (response.status === 403 || response.status === 429) {
            console.warn(`[YouTube API] Key at index ${testIndex} failed (Status: ${response.status}). Trying next fallback key if available...`);
            lastResponse = response;
            continue; // Move to next iteration and try next key
        }

        // For other errors (400, 404, etc.), don't retry keys, just return the failure
        return response;
    }

    // If all keys fail (e.g. all out of quota), return the last failed response to trigger mock data fallback
    if (!lastResponse) {
        throw new Error("No YouTube API keys provided or all requests failed immediately.");
    }
    return lastResponse as Response;
}

// -----------------------------------------------------------------------------
// MOCK FALLBACK DATA (For when YouTube Quota is Expired)
// -----------------------------------------------------------------------------

export const MOCK_TRACKS: Track[] = [
    {
        id: "jfKfPfyJRdk",
        title: "Starboy",
        artist: "The Weeknd",
        durationMs: 230000,
        albumImageUrl: "https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg"
    },
    {
        id: "1cQh1ccqu8M",
        title: "SLOW DANCING IN THE DARK",
        artist: "Joji",
        durationMs: 209000,
        albumImageUrl: "https://i.ytimg.com/vi/1cQh1ccqu8M/maxresdefault.jpg"
    },
    {
        id: "bo_efYhYU2A",
        title: "Blinding Lights",
        artist: "The Weeknd",
        durationMs: 200000,
        albumImageUrl: "https://i.ytimg.com/vi/4NRXx6U8ABQ/maxresdefault.jpg"
    },
];

export const getMockPlaylists = (): Playlist[] => [
    {
        id: "PL4fGSI1pQAa6Avo-Z12oFkC9GqG9pD_u5",
        title: "Trending Music 2026",
        description: "The hottest tracks globally right now. A fallback playlist when API quota is exhausted.",
        imageUrl: MOCK_TRACKS[0].albumImageUrl || "",
        tracks: MOCK_TRACKS,
    },
    {
        id: "PL4fGSI1pQAa5Q2U2a2UcwR1aZ0fH90wN-",
        title: "Late Night Drive",
        description: "Atmospheric tracks for midnight cruising.",
        imageUrl: MOCK_TRACKS[1].albumImageUrl || "",
        tracks: MOCK_TRACKS,
    }
];

// Helper to pull the best available thumbnail (16:9 ratio, to be cropped by UI)
const getBestThumbnailUrl = (thumbnails: { maxres?: { url: string }, high?: { url: string }, medium?: { url: string }, default?: { url: string } }): string => {
    if (!thumbnails) return "";
    const best = thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default;
    return best?.url || "";
};

// -----------------------------------------------------------------------------
// DATA FETCHING FUNCTIONS 
// -----------------------------------------------------------------------------

export const searchMusic = async (query: string, order: string = "relevance", maxResults: number = 20): Promise<Track[]> => {
    const searchUrl = new URL(`${BASE_URL}/search`);
    searchUrl.searchParams.append("part", "snippet");
    searchUrl.searchParams.append("q", query);
    searchUrl.searchParams.append("type", "video");
    searchUrl.searchParams.append("videoCategoryId", "10"); // 10 = Music Category
    searchUrl.searchParams.append("maxResults", String(maxResults));
    searchUrl.searchParams.append("order", order);
    // Key will be appended inside fetchWithFallback

    const response = await fetchWithFallback(searchUrl, {
        next: {
            revalidate: 3600, // Edge cache search queries for 1 hour to preserve quota
        },
    });

    if (!response.ok) {
        console.warn(`[YouTube API] Search failed: ${response.status} ${response.statusText}. Using mock fallback.`);
        return MOCK_TRACKS;
    }

    const data = await response.json();

    const tracks: Track[] = data.items.map((item: { id: { videoId: string }, snippet: { title: string, channelTitle: string, thumbnails: { maxres?: { url: string }, high?: { url: string }, medium?: { url: string }, default?: { url: string } } } }) => {
        const { title, artist } = getCleanMetadata(item.snippet.title, item.snippet.channelTitle);

        return {
            id: item.id.videoId,
            title,
            artist,
            durationMs: 0,
            albumImageUrl: getBestThumbnailUrl(item.snippet.thumbnails),
        };
    });

    return tracks;
};

export const searchPlaylists = async (query: string): Promise<Playlist[]> => {
    const searchUrl = new URL(`${BASE_URL}/search`);
    searchUrl.searchParams.append("part", "snippet");
    searchUrl.searchParams.append("q", query);
    searchUrl.searchParams.append("type", "playlist");
    searchUrl.searchParams.append("maxResults", "8");

    const response = await fetchWithFallback(searchUrl, {
        next: {
            revalidate: 3600, // Edge cache
        },
    });

    if (!response.ok) {
        console.warn(`[YouTube API] Playlist search failed: ${response.status} ${response.statusText}. Using mock playlists.`);
        return getMockPlaylists();
    }

    const data = await response.json();

    return data.items.map((item: { id: { playlistId: string }, snippet: { title: string, description: string, thumbnails: { maxres?: { url: string }, high?: { url: string }, medium?: { url: string }, default?: { url: string } } } }) => ({
        id: item.id.playlistId,
        title: item.snippet.title,
        description: item.snippet.description,
        imageUrl: getBestThumbnailUrl(item.snippet.thumbnails),
        tracks: [], // Tracks aren't loaded in search results
    }));
};

export const getPlaylistDetails = async (playlistId: string): Promise<Playlist> => {
    // 1. Fetch playlist metadata
    const playlistUrl = new URL(`${BASE_URL}/playlists`);
    playlistUrl.searchParams.append("part", "snippet");
    playlistUrl.searchParams.append("id", playlistId);

    // 2. Fetch up to 50 playlist items
    const itemsUrl = new URL(`${BASE_URL}/playlistItems`);
    itemsUrl.searchParams.append("part", "snippet");
    itemsUrl.searchParams.append("playlistId", playlistId);
    itemsUrl.searchParams.append("maxResults", "50");

    // Execute both requests in parallel for performance using the fallback wrapper
    const [playlistRes, itemsRes] = await Promise.all([
        fetchWithFallback(playlistUrl, { next: { revalidate: 3600 } }),
        fetchWithFallback(itemsUrl, { next: { revalidate: 3600 } }),
    ]);

    if (!playlistRes.ok) {
        console.warn(`[YouTube API] Playlist details failed: ${playlistRes.status} ${playlistRes.statusText}. Sending mock data.`);
        const mocks = getMockPlaylists();
        // Return a mock playlist, preferring the one requested if we somehow mocked its ID
        return mocks.find(m => m.id === playlistId) || { ...mocks[0], id: playlistId };
    }

    const playlistData = await playlistRes.json();

    // Items might return 404 for auto-generated radio mixes (RD...) or private lists.
    let itemsData = { items: [] };
    if (itemsRes.ok) {
        itemsData = await itemsRes.json();
    } else {
        console.warn(`Could not fetch items for playlist ${playlistId}. API returned: ${itemsRes.status} ${itemsRes.statusText}`);
    }

    if (!playlistData.items || playlistData.items.length === 0) {
        throw new Error("Playlist not found.");
    }

    const playlistSnippet = playlistData.items[0].snippet;

    // Map the playlist items (videos)
    const tracks = itemsData.items.map((item: { snippet: { title: string, videoOwnerChannelTitle?: string, channelTitle: string, resourceId: { videoId: string }, thumbnails: { maxres?: { url: string }, high?: { url: string }, medium?: { url: string }, default?: { url: string } } } }) => {
        const { title, artist } = getCleanMetadata(
            item.snippet.title,
            item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle
        );

        return {
            id: item.snippet.resourceId.videoId,
            title,
            artist,
            durationMs: 0,
            albumImageUrl: getBestThumbnailUrl(item.snippet.thumbnails),
        };
    });

    return {
        id: playlistId,
        title: playlistSnippet.title,
        description: playlistSnippet.description,
        imageUrl: getBestThumbnailUrl(playlistSnippet.thumbnails),
        tracks: tracks,
    };
};
