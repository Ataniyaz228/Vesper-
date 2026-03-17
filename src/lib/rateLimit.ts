interface RateLimitEntry { count: number; resetAt: number; }
const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true };
    }

    if (entry.count >= limit) {
        return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }

    entry.count++;
    return { allowed: true };
}
