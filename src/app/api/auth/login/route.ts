/**
 * POST /api/auth/login
 * Body: { email, password }
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
        const { allowed, retryAfter } = checkRateLimit(`login_${ip}`, 10, 15 * 60 * 1000);

        if (!allowed) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429, headers: { "Retry-After": String(retryAfter) } }
            );
        }

        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
        }

        // ── Find user ────────────────────────────────────────────────────────
        const [user] = await query<{
            id: number;
            email: string;
            username: string;
            password_hash: string;
        }>(
            "SELECT id, email, username, password_hash FROM users WHERE email = $1 LIMIT 1",
            [email.toLowerCase()]
        );

        if (!user) {
            // Intentionally vague to prevent email enumeration
            return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
        }

        // ── Verify password ─────────────────────────────────────────────────
        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) {
            return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
        }

        // ── Issue JWT session ───────────────────────────────────────────────
        const token = signToken({ userId: user.id, email: user.email, username: user.username });
        await setSessionCookie(token);

        return NextResponse.json({
            user: { id: user.id, email: user.email, username: user.username },
        });
    } catch (err) {
        console.error("[/api/auth/login]", err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
