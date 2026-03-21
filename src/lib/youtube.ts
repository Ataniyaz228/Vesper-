import "server-only";
import { getCleanMetadata } from "./metadata";
import { logger } from "./logger";

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
    durationMs: number;
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

/**
 * Stateless fetch wrapper — tries all keys from index 0 on every request.
 * No module-level state that resets on cold start.
 * 403 / 429 → try next key. Other errors → return immediately.
 */
async function fetchWithFallback(url: URL, init?: RequestInit): Promise<Response> {
    const keys = getApiKeys();

    for (let i = 0; i < keys.length; i++) {
        url.searchParams.set("key", keys[i]);
        const response = await fetch(url.toString(), init);

        if (response.ok) return response;

        if (response.status === 403 || response.status === 429) {
            logger.warn(`[YouTube] Key ${i} quota exceeded (${response.status}), trying next`);
            continue;
        }

        // Other errors (400, 404, etc.) — don't retry, return as-is
        return response;
    }

    logger.error("[YouTube] All API keys exhausted");
    return new Response(null, { status: 503 });
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
    searchUrl.searchParams.append("videoCategoryId", "10");
    searchUrl.searchParams.append("maxResults", String(maxResults));
    searchUrl.searchParams.append("order", order);

    const response = await fetchWithFallback(searchUrl, {
        next: { revalidate: 3600 },
    });

    if (!response.ok) {
        logger.warn(`[YouTube] Search failed: ${response.status} ${response.statusText}. Using mock fallback.`);
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
        next: { revalidate: 3600 },
    });

    if (!response.ok) {
        logger.warn(`[YouTube] Playlist search failed: ${response.status} ${response.statusText}. Using mock playlists.`);
        return getMockPlaylists();
    }

    const data = await response.json();

    return data.items.map((item: { id: { playlistId: string }, snippet: { title: string, description: string, thumbnails: { maxres?: { url: string }, high?: { url: string }, medium?: { url: string }, default?: { url: string } } } }) => ({
        id: item.id.playlistId,
        title: item.snippet.title,
        description: item.snippet.description,
        imageUrl: getBestThumbnailUrl(item.snippet.thumbnails),
        tracks: [],
    }));
};

export const getPlaylistDetails = async (playlistId: string): Promise<Playlist> => {
    const playlistUrl = new URL(`${BASE_URL}/playlists`);
    playlistUrl.searchParams.append("part", "snippet");
    playlistUrl.searchParams.append("id", playlistId);

    const itemsUrl = new URL(`${BASE_URL}/playlistItems`);
    itemsUrl.searchParams.append("part", "snippet");
    itemsUrl.searchParams.append("playlistId", playlistId);
    itemsUrl.searchParams.append("maxResults", "50");

    const [playlistRes, itemsRes] = await Promise.all([
        fetchWithFallback(playlistUrl, { next: { revalidate: 3600 } }),
        fetchWithFallback(itemsUrl, { next: { revalidate: 3600 } }),
    ]);

    if (!playlistRes.ok) {
        logger.warn(`[YouTube] Playlist details failed: ${playlistRes.status} ${playlistRes.statusText}. Sending mock data.`);
        const mocks = getMockPlaylists();
        return mocks.find(m => m.id === playlistId) || { ...mocks[0], id: playlistId };
    }

    const playlistData = await playlistRes.json();

    let itemsData = { items: [] };
    if (itemsRes.ok) {
        itemsData = await itemsRes.json();
    } else {
        logger.warn(`[YouTube] Could not fetch items for playlist ${playlistId}: ${itemsRes.status} ${itemsRes.statusText}`);
    }

    if (!playlistData.items || playlistData.items.length === 0) {
        throw new Error("Playlist not found.");
    }

    const playlistSnippet = playlistData.items[0].snippet;

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
        tracks,
    };
};
