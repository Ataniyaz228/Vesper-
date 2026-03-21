/**
 * GET /api/search?q=...
 *
 * Auth required — unauthenticated clients should not consume YouTube API quota.
 * Rate limited: 20 searches / minute per IP (fires before auth check).
 */
import { type NextRequest, NextResponse } from "next/server";
import { searchMusic } from "@/lib/youtube";
import { rateLimiters, tooManyRequests, getClientIp } from "@/lib/rateLimit";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
    // 1. IP rate limit — runs before auth so unauthenticated probes also consume tokens
    const ip = getClientIp(request);
    const rl = await rateLimiters.search(ip);
    if (!rl.allowed) return tooManyRequests(rl.retryAfter ?? 60) as unknown as NextResponse;

    // 2. Auth guard
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 3. Parse query
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q")?.trim();
    if (!query) return NextResponse.json({ error: "Missing search query" }, { status: 400 });

    try {
        const results = await searchMusic(query);
        return NextResponse.json(results);
    } catch (error) {
        console.error("[/api/search]", error);
        return NextResponse.json({ error: "Failed to fetch from YouTube" }, { status: 500 });
    }
}
