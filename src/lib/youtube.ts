import "server-only";
import { getCleanMetadata, getITunesCoverArt } from "./metadata";

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
const getApiKey = () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("Missing YOUTUBE_API_KEY environment variable.");
    }
    return apiKey;
};

const BASE_URL = "https://www.googleapis.com/youtube/v3";

// Helper to pull the best available thumbnail (16:9 ratio, to be cropped by UI)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getBestThumbnailUrl = (thumbnails: any): string => {
    if (!thumbnails) return "";
    const best = thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default;
    return best?.url || "";
};

// -----------------------------------------------------------------------------
// DATA FETCHING FUNCTIONS 
// -----------------------------------------------------------------------------

export const searchMusic = async (query: string, order: string = "relevance", maxResults: number = 20): Promise<Track[]> => {
    const apiKey = getApiKey();
    const searchUrl = new URL(`${BASE_URL}/search`);
    searchUrl.searchParams.append("part", "snippet");
    searchUrl.searchParams.append("q", query);
    searchUrl.searchParams.append("type", "video");
    searchUrl.searchParams.append("videoCategoryId", "10"); // 10 = Music Category
    searchUrl.searchParams.append("maxResults", String(maxResults));
    searchUrl.searchParams.append("order", order);
    searchUrl.searchParams.append("key", apiKey);

    const response = await fetch(searchUrl.toString(), {
        next: {
            revalidate: 3600, // Edge cache search queries for 1 hour to preserve quota
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to search YouTube: ${response.statusText}`);
    }

    const data = await response.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracks: Track[] = data.items.map((item: any) => {
        const { title, artist } = getCleanMetadata(item.snippet.title, item.snippet.channelTitle);

        return {
            id: item.id.videoId,
            title,
            artist,
            durationMs: 0,
            albumImageUrl: getBestThumbnailUrl(item.snippet.thumbnails),
        };
    });

    // Enhancement: Return basic results fast by default.
    // High-res art fetching is very slow for large lists.
    return tracks;
};

export const searchPlaylists = async (query: string): Promise<Playlist[]> => {
    const apiKey = getApiKey();
    const searchUrl = new URL(`${BASE_URL}/search`);
    searchUrl.searchParams.append("part", "snippet");
    searchUrl.searchParams.append("q", query);
    searchUrl.searchParams.append("type", "playlist");
    searchUrl.searchParams.append("maxResults", "8");
    searchUrl.searchParams.append("key", apiKey);

    const response = await fetch(searchUrl.toString(), {
        next: {
            revalidate: 3600, // Edge cache
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to search YouTube playlists: ${response.statusText}`);
    }

    const data = await response.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.items.map((item: any) => ({
        id: item.id.playlistId,
        title: item.snippet.title,
        description: item.snippet.description,
        imageUrl: getBestThumbnailUrl(item.snippet.thumbnails),
        tracks: [], // Tracks aren't loaded in search results
    }));
};

export const getPlaylistDetails = async (playlistId: string): Promise<Playlist> => {
    const apiKey = getApiKey();

    // 1. Fetch playlist metadata
    const playlistUrl = new URL(`${BASE_URL}/playlists`);
    playlistUrl.searchParams.append("part", "snippet");
    playlistUrl.searchParams.append("id", playlistId);
    playlistUrl.searchParams.append("key", apiKey);

    // 2. Fetch up to 50 playlist items
    const itemsUrl = new URL(`${BASE_URL}/playlistItems`);
    itemsUrl.searchParams.append("part", "snippet");
    itemsUrl.searchParams.append("playlistId", playlistId);
    itemsUrl.searchParams.append("maxResults", "50");
    itemsUrl.searchParams.append("key", apiKey);

    // Execute both requests in parallel for performance
    const [playlistRes, itemsRes] = await Promise.all([
        fetch(playlistUrl.toString(), { next: { revalidate: 3600 } }),
        fetch(itemsUrl.toString(), { next: { revalidate: 3600 } }),
    ]);

    if (!playlistRes.ok) {
        throw new Error(`Failed to fetch playlist metadata: ${playlistRes.statusText}`);
    }

    const playlistData = await playlistRes.json();

    // Items might return 404 for auto-generated radio mixes (RD...) or private lists.
    // Instead of crashing the whole page, we gracefully handle it by defaulting to an empty array.
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracks = itemsData.items.map((item: any) => {
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

    // Enhancement: Return basic metadata fast. 
    // We remove the high-res iTunes enhancement from here because it slows down the initial page load 
    // for playlists with many tracks. We will use YouTube thumbnails as base.
    return {
        id: playlistId,
        title: playlistSnippet.title,
        description: playlistSnippet.description,
        imageUrl: getBestThumbnailUrl(playlistSnippet.thumbnails),
        tracks: tracks,
    };
};
