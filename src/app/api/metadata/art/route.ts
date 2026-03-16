import { NextResponse } from "next/server";
import { getITunesCoverArt } from "@/lib/metadata";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title");
    const artist = searchParams.get("artist");

    if (!title || !artist) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    try {
        const artUrl = await getITunesCoverArt(title, artist);
        return NextResponse.json({ url: artUrl });
    } catch (error) {
        console.error("[api/metadata/art] Error:", error);
        return NextResponse.json({ error: "Failed to fetch art" }, { status: 500 });
    }
}
