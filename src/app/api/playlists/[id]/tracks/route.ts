import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/playlists/[id]/tracks — add a track
export async function POST(req: Request, ctx: Ctx) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const { track } = await req.json();
    if (!track?.id) return NextResponse.json({ error: "track required" }, { status: 400 });

    // Verify ownership
    const own = await query(
        `SELECT id FROM user_playlists WHERE id = $1 AND user_id = $2`,
        [id, user.userId]
    );
    if (!own.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
        const maxPos = await query(
            `SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM user_playlist_tracks WHERE playlist_id = $1`,
            [id]
        );
        const pos = maxPos[0]?.pos ?? 0;

        await query(
            `INSERT INTO user_playlist_tracks (playlist_id, track_id, track_data, position)
             VALUES ($1, $2, $3::jsonb, $4)
             ON CONFLICT (playlist_id, track_id) DO NOTHING`,
            [id, track.id, JSON.stringify(track), pos]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api/playlists/[id]/tracks] POST error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// DELETE /api/playlists/[id]/tracks — remove a track { trackId }
export async function DELETE(req: Request, ctx: Ctx) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const { trackId } = await req.json();
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });

    const own = await query(
        `SELECT id FROM user_playlists WHERE id = $1 AND user_id = $2`,
        [id, user.userId]
    );
    if (!own.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
        await query(
            `DELETE FROM user_playlist_tracks WHERE playlist_id = $1 AND track_id = $2`,
            [id, trackId]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api/playlists/[id]/tracks] DELETE error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
