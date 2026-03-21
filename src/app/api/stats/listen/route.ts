/**
 * POST /api/stats/listen
 * Rate limited: 200 req/hr per IP. Auth required.
 */
import { type NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getGenreForArtist } from "@/lib/lastfm";
import { rateLimiters, tooManyRequests, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
    // 1. Rate limit
    const ip = getClientIp(req);
    const rl = await rateLimiters.statsListen(ip);
    if (!rl.allowed) return tooManyRequests(rl.retryAfter ?? 60) as unknown as NextResponse;

    // 2. Auth
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { track } = await req.json() as { track?: { id?: string; title?: string; artist?: string; albumImageUrl?: string; durationMs?: number } };
        if (!track?.id) return NextResponse.json({ error: "Invalid track data" }, { status: 400 });

        const genre = await getGenreForArtist(track.artist ?? "Unknown");

        await query(`
            INSERT INTO listening_history (user_id, track_id, title, artist, album_image_url, duration_ms, genre)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            user.userId,
            track.id,
            track.title ?? "",
            track.artist ?? "",
            track.albumImageUrl ?? "",
            track.durationMs ?? 0,
            genre
        ]);

        return NextResponse.json({ success: true, genre });
    } catch (error) {
        console.error("[/api/stats/listen]", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
