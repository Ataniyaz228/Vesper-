/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, signToken, setSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
        const { allowed, retryAfter } = await checkRateLimit(`register_${ip}`, 5, 60 * 60 * 1000);

        if (!allowed) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429, headers: { "Retry-After": String(retryAfter) } }
            );
        }

        const { username, email, password } = await req.json();

        // ── Validation ──────────────────────────────────────────────────────
        if (!username || !email || !password) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }
        if (username.length < 2 || username.length > 32) {
            return NextResponse.json({ error: "Username must be 2–32 characters." }, { status: 400 });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
        }

        // ── Duplicate check ─────────────────────────────────────────────────
        const existing = await query(
            "SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1",
            [email.toLowerCase(), username.toLowerCase()]
        );
        if (existing.length > 0) {
            return NextResponse.json(
                { error: "An account with that email or username already exists." },
                { status: 409 }
            );
        }

        // ── Create user ─────────────────────────────────────────────────────
        const passwordHash = await hashPassword(password);
        const avatarSeed = username.toLowerCase();

        const [user] = await query<{ id: number; email: string; username: string }>(
            `INSERT INTO users (username, email, password_hash, avatar_seed)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username`,
            [username.toLowerCase(), email.toLowerCase(), passwordHash, avatarSeed]
        );

        // ── Issue JWT session ───────────────────────────────────────────────
        const token = signToken({ userId: user.id, email: user.email, username: user.username });
        await setSessionCookie(token);

        return NextResponse.json(
            { user: { id: user.id, email: user.email, username: user.username } },
            { status: 201 }
        );
    } catch (err) {
        console.error("[/api/auth/register]", err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
