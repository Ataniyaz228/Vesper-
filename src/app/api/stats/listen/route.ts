import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getGenreForArtist } from "@/lib/lastfm";

export async function POST(req: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { track } = await req.json();
        if (!track || !track.id) return NextResponse.json({ error: "Invalid track data" }, { status: 400 });

        // Fetch genre asynchronously
        const genre = await getGenreForArtist(track.artist || "Unknown");

        await query(`
            INSERT INTO listening_history (user_id, track_id, title, artist, album_image_url, duration_ms, genre)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            user.userId,
            track.id,
            track.title,
            track.artist,
            track.albumImageUrl || "",
            track.durationMs || 0,
            genre
        ]);

        return NextResponse.json({ success: true, genre });
    } catch (error) {
        console.error("[api/stats/listen] POST Error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
