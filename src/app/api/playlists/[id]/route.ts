import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/playlists/[id] — rename
export async function PATCH(req: Request, ctx: Ctx) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const { title } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

    try {
        await query(
            `UPDATE user_playlists SET title = $1 WHERE id = $2 AND user_id = $3`,
            [title.trim(), id, user.userId]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api/playlists/[id]] PATCH error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// DELETE /api/playlists/[id] — delete playlist (cascade removes tracks)
export async function DELETE(_req: Request, ctx: Ctx) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    try {
        await query(
            `DELETE FROM user_playlists WHERE id = $1 AND user_id = $2`,
            [id, user.userId]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api/playlists/[id]] DELETE error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// GET /api/playlists/[id] — get full playlist with tracks
export async function GET(_req: Request, ctx: Ctx) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    try {
        const plRows = await query(
            `SELECT id, title, created_at as "createdAt" FROM user_playlists WHERE id = $1 AND user_id = $2`,
            [id, user.userId]
        );
        if (!plRows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const tracks = await query(
            `SELECT track_data FROM user_playlist_tracks WHERE playlist_id = $1 ORDER BY position ASC`,
            [id]
        );

        return NextResponse.json({
            playlist: {
                ...plRows[0],
                tracks: tracks.map((r) => r["track_data"]),
            }
        });
    } catch (error) {
        console.error("[api/playlists/[id]] GET error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
