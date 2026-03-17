import { NextResponse } from "next/server";
import { searchPlaylists } from "@/lib/youtube";

export async function GET() {
    try {
        const playlists = await searchPlaylists(`trending music hits ${new Date().getFullYear()} album`);
        return NextResponse.json(playlists);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 });
    }
}
