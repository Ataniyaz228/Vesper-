import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

/** Ensure the tables exist (idempotent migration) */
async function ensureTables() {
    await query(`
        CREATE TABLE IF NOT EXISTS user_playlists (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT 'Новый плейлист',
            created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS user_playlist_tracks (
            playlist_id UUID REFERENCES user_playlists(id) ON DELETE CASCADE,
            track_id TEXT NOT NULL,
            track_data JSONB NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            added_at TIMESTAMPTZ DEFAULT now(),
            PRIMARY KEY (playlist_id, track_id)
        );
    `, []);
}

// GET /api/playlists — list user's playlists with basic track count
export async function GET() {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await ensureTables();

        const playlists = await query(`
            SELECT p.id, p.title, p.created_at as "createdAt",
                   COUNT(t.track_id)::int as "trackCount",
                   (
                     SELECT t2.track_data->>'albumImageUrl'
                     FROM user_playlist_tracks t2
                     WHERE t2.playlist_id = p.id
                     ORDER BY t2.position ASC
                     LIMIT 1
                   ) as "coverUrl"
            FROM user_playlists p
            LEFT JOIN user_playlist_tracks t ON t.playlist_id = p.id
            WHERE p.user_id = $1
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `, [user.userId]);

        return NextResponse.json({ playlists });
    } catch (error) {
        console.error("[api/playlists] GET error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// POST /api/playlists — create playlist
export async function POST(req: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await ensureTables();
        const body = await req.json();
        const title = (body?.title as string)?.trim() || "Новый плейлист";

        const rows = await query(`
            INSERT INTO user_playlists (user_id, title) VALUES ($1, $2)
            RETURNING id, title, created_at as "createdAt"
        `, [user.userId, title]);

        return NextResponse.json({ playlist: { ...rows[0], trackCount: 0, coverUrl: null } });
    } catch (error) {
        console.error("[api/playlists] POST error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
