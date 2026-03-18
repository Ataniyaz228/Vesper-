import { useState, useEffect } from 'react';

export interface LyricLine {
    time: number;
    text: string;
}

export function useLyrics(title?: string, artist?: string, durationMs?: number) {
    const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!title || !artist) {
            setLyrics(null);
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        setError(null);

        async function fetchLyrics() {
            try {
                // We use LRCLIB's /api/get which requires exact matches, or /api/search
                // It's safer to use /api/get and strip extra stuff from our title
                const queryTitle = encodeURIComponent(title || "");
                const queryArtist = encodeURIComponent(artist || "");

                // First try exact match
                let res = await fetch(`https://lrclib.net/api/get?track_name=${queryTitle}&artist_name=${queryArtist}`);
                let data = await res.json();

                // If not found, try search and get best match
                if (!res.ok || !data.syncedLyrics) {
                    res = await fetch(`https://lrclib.net/api/search?track_name=${queryTitle}&artist_name=${queryArtist}`);
                    const searchData = await res.json();
                    if (searchData && searchData.length > 0) {
                        // Find the first one that has synced lyrics
                        const best = searchData.find((d: any) => d.syncedLyrics);
                        if (best) data = best;
                    }
                }

                if (!isMounted) return;

                if (data && data.syncedLyrics) {
                    const parsed = parseLrc(data.syncedLyrics);
                    setLyrics(parsed);
                } else if (data && data.plainLyrics) {
                    // Fallback to plain lyrics with dummy times
                    setLyrics([{ time: 0, text: "Lyrics available but not synchronized." }]);
                } else {
                    setLyrics(null);
                }
            } catch (err) {
                if (isMounted) setError("Failed to load lyrics");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchLyrics();

        return () => {
            isMounted = false;
        };
    }, [title, artist]);

    return { lyrics, isLoading, error };
}

// Parses standard LRC format: "[00:15.30] Hello world"
function parseLrc(lrc: string): LyricLine[] {
    const lines = lrc.split("\n");
    const result: LyricLine[] = [];

    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);

            const timeInSeconds = (minutes * 60) + seconds + (milliseconds / 1000);
            const text = line.replace(timeRegex, "").trim();

            if (text) {
                result.push({ time: timeInSeconds, text });
            } else {
                result.push({ time: timeInSeconds, text: "♫" }); // Instrumental break marker
            }
        }
    }

    return result.sort((a, b) => a.time - b.time);
}
