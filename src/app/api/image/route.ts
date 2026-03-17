import { NextResponse } from "next/server";

const ALLOWED_IMAGE_HOSTS = new Set([
    "i.ytimg.com",
    "yt3.ggpht.com",
    "is1-ssl.mzstatic.com",
    "is2-ssl.mzstatic.com",
    "images.unsplash.com",
    "lh3.googleusercontent.com",
]);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return new NextResponse("Malformed URL", { status: 400 });
    }

    if (parsed.protocol !== "https:") {
        return new NextResponse("Forbidden protocol", { status: 403 });
    }

    if (!ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) {
        return new NextResponse("Forbidden host", { status: 403 });
    }

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "image/webp,image/apng,image/*,*/*;q=0.8"
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
        }

        const buffer = await res.arrayBuffer();

        const headers = new Headers();
        headers.set("Content-Type", res.headers.get("Content-Type") || "image/jpeg");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("X-Content-Type-Options", "nosniff");

        return new NextResponse(buffer, { headers });
    } catch (e) {
        console.error("Image proxy error:", e);
        return new NextResponse("Error fetching image", { status: 500 });
    }
}
