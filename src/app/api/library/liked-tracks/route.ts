import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

// GET /api/library/liked-tracks — Returns all liked tracks for current user
export async function GET() {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const rows = await query(`
            SELECT track_id as id, title, artist, album_image_url as "albumImageUrl", duration_ms as "durationMs"
            FROM liked_tracks
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [user.userId]);

        return NextResponse.json({ tracks: rows });
    } catch (error) {
        console.error("[api/library/liked-tracks] GET Error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// POST /api/library/liked-tracks — Likes a track
export async function POST(req: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { track } = await req.json();
        if (!track || !track.id) return NextResponse.json({ error: "Invalid track data" }, { status: 400 });

        await query(`
            INSERT INTO liked_tracks (user_id, track_id, title, artist, album_image_url, duration_ms)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, track_id) DO NOTHING
        `, [user.userId, track.id, track.title, track.artist, track.albumImageUrl || "", track.durationMs || 0]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api/library/liked-tracks] POST Error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// DELETE /api/library/liked-tracks — Unlikes a track
export async function DELETE(req: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { trackId } = await req.json();
        if (!trackId) return NextResponse.json({ error: "Missing trackId" }, { status: 400 });

        await query(`
            DELETE FROM liked_tracks
            WHERE user_id = $1 AND track_id = $2
        `, [user.userId, trackId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api/library/liked-tracks] DELETE Error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
