// Server Component — fully dynamic, NO hardcoded artists
import { searchMusic, Track } from "@/lib/youtube";
import { DiscoverClientView } from "./DiscoverClientView";

// Cinematic color palettes assigned by slot, not by artist
const COLOR_PALETTES = [
    { color1: "#1a0a2e", color2: "#7b2d8b", bgGradient: "radial-gradient(circle at 65% 40%, #1e0a30 0%, #0d0515 60%, #000 100%)" },
    { color1: "#0a1a2e", color2: "#2d7bb5", bgGradient: "radial-gradient(circle at 65% 40%, #081828 0%, #030d15 60%, #000 100%)" },
    { color1: "#2e0a0a", color2: "#b52d2d", bgGradient: "radial-gradient(circle at 65% 40%, #300808 0%, #150303 60%, #000 100%)" },
    { color1: "#0d2e0a", color2: "#2db52d", bgGradient: "radial-gradient(circle at 65% 40%, #0a3008 0%, #031503 60%, #000 100%)" },
    { color1: "#2e250a", color2: "#b5852d", bgGradient: "radial-gradient(circle at 65% 40%, #302808 0%, #151003 60%, #000 100%)" },
];

export default async function DiscoverPage() {
    let tracks: (Track & { color1: string; color2: string; bgGradient: string })[] = [];

    try {
        // Fetch the 10 most-viewed music videos and take the first 5 with valid thumbnails.
        // "order=viewCount" returns objectively popular content without hardcoding any artist names.
        const fetched = await searchMusic("official music video", "viewCount", 10);

        tracks = fetched
            .filter((t: Track) => t.albumImageUrl)
            .slice(0, 5)
            .map((t: Track, i: number) => ({
                ...t,
                ...COLOR_PALETTES[i % COLOR_PALETTES.length],
            }));
    } catch (e) {
        console.error("Discover page: failed to fetch tracks", e);
    }

    return <DiscoverClientView initialTracks={tracks} />;
}
