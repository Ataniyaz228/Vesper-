import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
    const user = await getSessionUser();
    if (!user?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = user.userId;

        // 1. Total Stats
        const summaryResults = await query<{ total_plays: string, unique_tracks: string, total_seconds: string }>(
            `SELECT 
                COUNT(*) as total_plays,
                COUNT(DISTINCT track_id) as unique_tracks,
                COALESCE(SUM(duration_ms) / 1000, 0) as total_seconds
             FROM listening_history 
             WHERE user_id = $1`,
            [userId]
        );

        const summary = summaryResults[0];

        // 2. Top Tracks
        interface TrackRow {
            id: string;
            title: string;
            artist: string;
            img: string;
            duration_ms: number;
            play_count: string;
        }
        const topTracksResults = await query<TrackRow>(
            `SELECT 
                track_id as id, 
                MAX(title) as title, 
                MAX(artist) as artist, 
                MAX(album_image_url) as img, 
                MAX(duration_ms) as duration_ms,
                COUNT(*) as play_count
             FROM listening_history 
             WHERE user_id = $1 
             GROUP BY track_id
             ORDER BY play_count DESC 
             LIMIT 10`,
            [userId]
        );

        // 3. Top Genres (Handle comma-separated strings using unnest)
        const topGenresResults = await query<{ genre: string, play_count: string }>(
            `SELECT 
                TRIM(unnested_genre) as genre, 
                COUNT(*) as play_count
             FROM (
                SELECT unnest(string_to_array(genre, ', ')) as unnested_genre
                FROM listening_history
                WHERE user_id = $1 AND genre != 'Unknown'
             ) sub
             GROUP BY genre 
             ORDER BY play_count DESC 
             LIMIT 5`,
            [userId]
        );

        // 4. Activity Streak (simplified: count unique days in the last 30 days)
        const streakResults = await query<{ active_days: string }>(
            `SELECT COUNT(DISTINCT DATE(listened_at)) as active_days
             FROM listening_history
             WHERE user_id = $1 AND listened_at > NOW() - INTERVAL '30 days'`,
            [userId]
        );

        // 5. Last Resonated
        const lastResonatedResult = await query<{ title: string, artist: string, listened_at: string }>(
            `SELECT title, artist, listened_at 
             FROM listening_history 
             WHERE user_id = $1 
             ORDER BY listened_at DESC 
             LIMIT 1`,
            [userId]
        );

        const totalPlaysVal = parseInt(summary?.total_plays || "0");

        return NextResponse.json({
            stats: {
                totalSeconds: parseInt(summary?.total_seconds || "0"),
                uniqueTracks: parseInt(summary?.unique_tracks || "0"),
                totalPlays: totalPlaysVal,
                activeDays: parseInt(streakResults[0]?.active_days || "0"),
                lastResonated: lastResonatedResult[0] || null
            },
            topTracks: topTracksResults.map(row => ({
                id: row.id,
                title: row.title,
                artist: row.artist,
                img: row.img,
                dur: formatDuration(Math.round(row.duration_ms / 1000)),
                playCount: parseInt(row.play_count)
            })),
            topGenres: topGenresResults.map(row => ({
                name: row.genre,
                count: parseInt(row.play_count)
            }))
        });

    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
