import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

// GET /api/library/saved-playlists — Returns all saved playlists for current user
export async function GET() {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const rows = await query(`
            SELECT playlist_id as id, title, description, image_url as "imageUrl"
            FROM saved_playlists
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [user.userId]);

        return NextResponse.json({
            playlists: rows.map((r: any) => ({ ...r, tracks: [] }))
        });
    } catch (error) {
        console.error("[api/library/saved-playlists] GET Error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// POST /api/library/saved-playlists — Saves a playlist
export async function POST(req: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { playlist } = await req.json();
        if (!playlist || !playlist.id) return NextResponse.json({ error: "Invalid playlist data" }, { status: 400 });

        await query(`
            INSERT INTO saved_playlists (user_id, playlist_id, title, description, image_url)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, playlist_id) DO NOTHING
        `, [user.userId, playlist.id, playlist.title, playlist.description || "", playlist.imageUrl || ""]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api/library/saved-playlists] POST Error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// DELETE /api/library/saved-playlists — Unsaves a playlist
export async function DELETE(req: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { playlistId } = await req.json();
        if (!playlistId) return NextResponse.json({ error: "Missing playlistId" }, { status: 400 });

        await query(`
            DELETE FROM saved_playlists
            WHERE user_id = $1 AND playlist_id = $2
        `, [user.userId, playlistId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api/library/saved-playlists] DELETE Error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
