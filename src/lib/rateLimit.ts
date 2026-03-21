/**
 * lib/rateLimit.ts — PostgreSQL token bucket rate limiter.
 *
 * Replaces the in-memory Map implementation. Survives cold starts and
 * multi-instance deployments because state lives in PostgreSQL.
 *
 * Requires the rate_limit_buckets table:
 *
 *   CREATE TABLE IF NOT EXISTS rate_limit_buckets (
 *     key         TEXT        NOT NULL,
 *     tokens      REAL        NOT NULL DEFAULT 0,
 *     last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     PRIMARY KEY (key)
 *   );
 *
 * See: src/lib/db/migrations/add_rate_limit_buckets.sql
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// ── Token bucket core ─────────────────────────────────────────────────────────

interface RateLimitParams {
  key: string;
  maxTokens: number;   // max burst size
  refillRate: number;  // tokens / second
  cost: number;        // tokens consumed per request
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds
}

async function rateLimit(params: RateLimitParams): Promise<RateLimitResult> {
  const { key, maxTokens, refillRate, cost } = params;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Insert initial row if absent (full bucket), then lock it
    await client.query(
      `INSERT INTO rate_limit_buckets (key, tokens, last_refill)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO NOTHING`,
      [key, maxTokens]
    );

    const { rows } = await client.query<{ tokens: number; last_refill: Date }>(
      `SELECT tokens, last_refill FROM rate_limit_buckets WHERE key = $1 FOR UPDATE`,
      [key]
    );

    const row = rows[0]!;
    const elapsedSec = Math.max(0, (Date.now() - row.last_refill.getTime()) / 1000);
    const refilled = Math.min(maxTokens, row.tokens + elapsedSec * refillRate);
    const allowed = refilled >= cost;
    const newTokens = allowed ? refilled - cost : refilled;

    await client.query(
      `UPDATE rate_limit_buckets SET tokens = $1, last_refill = NOW() WHERE key = $2`,
      [newTokens, key]
    );

    await client.query("COMMIT");

    if (!allowed) {
      const deficit = cost - refilled;
      return { allowed: false, remaining: 0, retryAfter: Math.ceil(deficit / refillRate) };
    }
    return { allowed: true, remaining: Math.floor(newTokens) };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── Backward-compatible wrapper (used by existing routes) ──────────────────────

/**
 * Drop-in replacement for the old checkRateLimit(key, limit, windowMs).
 * Uses token bucket internally; maps limit/windowMs to token bucket params.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const refillRate = limit / (windowMs / 1000); // tokens per second
  return rateLimit({ key, maxTokens: limit, refillRate, cost: 1 })
    .then((r) => ({ allowed: r.allowed, retryAfter: r.retryAfter }))
    .catch(() => ({ allowed: true })); // fail open — don't block users on DB errors
}

// ── Named limiters ─────────────────────────────────────────────────────────────

export const rateLimiters = {
  search:     (ip: string) => rateLimit({ key: `search:${ip}`,  maxTokens: 20,  refillRate: 20 / 60,   cost: 1 }),
  auth:       (ip: string) => rateLimit({ key: `auth:${ip}`,    maxTokens: 10,  refillRate: 10 / 600,  cost: 1 }),
  statsListen:(ip: string) => rateLimit({ key: `listen:${ip}`,  maxTokens: 200, refillRate: 200 / 3600, cost: 1 }),
  imageProxy: (ip: string) => rateLimit({ key: `image:${ip}`,   maxTokens: 100, refillRate: 100 / 60,  cost: 1 }),
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export function tooManyRequests(retryAfter: number): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
      "X-RateLimit-Remaining": "0",
    },
  });
}

// ── Cleanup (call from instrumentation.ts) ─────────────────────────────────────

export async function cleanupRateLimitBuckets(): Promise<void> {
    await db.query(`DELETE FROM rate_limit_buckets WHERE last_refill < NOW() - INTERVAL '1 hour'`);
    logger.info('[rateLimit] Cleaned up stale buckets');
}
