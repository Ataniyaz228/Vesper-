/**
 * /api/image — SSRF-safe image proxy.
 * Whitelist + https-only + 8s timeout + per-IP rate limit.
 */
import { type NextRequest, NextResponse } from "next/server";
import { rateLimiters, tooManyRequests, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const ALLOWED_IMAGE_HOSTS = new Set([
    "i.ytimg.com",
    "img.youtube.com",
    "yt3.ggpht.com",
    "lastfm.freetls.fastly.net",
    "is1-ssl.mzstatic.com",
    "is2-ssl.mzstatic.com",
    "is3-ssl.mzstatic.com",
    "is4-ssl.mzstatic.com",
    "is5-ssl.mzstatic.com",
    "images.unsplash.com",
    "lh3.googleusercontent.com",
]);

export async function GET(request: NextRequest): Promise<NextResponse> {
    // 1. Rate limit — 100 req/min per IP
    const ip = getClientIp(request);
    const rl = await rateLimiters.imageProxy(ip);
    if (!rl.allowed) return tooManyRequests(rl.retryAfter ?? 60) as unknown as NextResponse;

    // 2. Validate URL param
    const { searchParams } = request.nextUrl;
    const url = searchParams.get("url");
    if (!url) return new NextResponse("Missing url parameter", { status: 400 });

    let parsed: URL;
    try { parsed = new URL(url); }
    catch { return new NextResponse("Malformed URL", { status: 400 }); }

    // 3. Protocol check
    if (parsed.protocol !== "https:") {
        return new NextResponse("Forbidden protocol", { status: 403 });
    }

    // 4. Hostname whitelist
    if (!ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) {
        return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
    }

    // 5. Fetch with 8s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);

    try {
        const res = await fetch(parsed.toString(), {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            },
        });

        if (!res.ok) return new NextResponse("Upstream error", { status: res.status >= 400 ? res.status : 502 });

        const contentType = res.headers.get("Content-Type") ?? "image/jpeg";
        if (!contentType.startsWith("image/")) {
            return new NextResponse("Not an image", { status: 502 });
        }

        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (err) {
        if ((err as Error).name === "AbortError") {
            return new NextResponse("Upstream timeout", { status: 504 });
        }
        console.error("[/api/image]", err);
        return new NextResponse("Error fetching image", { status: 500 });
    } finally {
        clearTimeout(timeoutId);
    }
}
