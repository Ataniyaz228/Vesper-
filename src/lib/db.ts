/**
 * db.ts — PostgreSQL connection pool
 * Uses the `pg` package. In production, replace with Neon/Supabase connection string.
 * Singleton pattern prevents connection pool exhaustion in Next.js during HMR.
 */
import { Pool, QueryResultRow } from "pg";
import { logger } from "./logger";

declare global {
    // Allow global var to survive HMR without TS errors
    var _pgPool: Pool | undefined;
}

function createPool(): Pool {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Fail fast in dev if DB is not ready
        connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
        logger.error("[db] Unexpected pool error:", err);
    });

    return pool;
}

// Singleton: reuse across hot-reloads in dev
export const db: Pool =
    globalThis._pgPool ?? (globalThis._pgPool = createPool());

/**
 * Convenience helper — executes a parameterised query.
 * Automatically acquires + releases a client.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
) {
    const { rows } = await db.query<T>(text, params);
    return rows;
}
