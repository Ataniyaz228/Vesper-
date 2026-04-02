/**
 * migrate.ts — One-shot migration script
 * Run with: npx tsx src/lib/migrate.ts
 * Creates/updates all tables. Safe to re-run (idempotent).
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { Pool } from "pg";

async function migrate() {
  console.log("[migrate] Starting...");

  // Connect to the actual database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing in environment variables.");
  }
  const isNeon = connectionString.includes("neon.tech");
  const pool = new Pool({ 
    connectionString,
    ssl: (isNeon || process.env.NODE_ENV === "production") ? { rejectUnauthorized: false } : false
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id            SERIAL PRIMARY KEY,
        username      VARCHAR(32) UNIQUE NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_seed   TEXT DEFAULT '',
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS liked_tracks(
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
        track_id         TEXT NOT NULL,
        title            TEXT NOT NULL,
        artist           TEXT NOT NULL,
        album_image_url  TEXT,
        duration_ms      INTEGER DEFAULT 0,
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, track_id)
      );

      CREATE TABLE IF NOT EXISTS saved_playlists(
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        playlist_id   TEXT NOT NULL,
        title         TEXT NOT NULL,
        description   TEXT,
        image_url     TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, playlist_id)
      );

      CREATE TABLE IF NOT EXISTS listening_history(
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
        track_id         TEXT NOT NULL,
        title            TEXT NOT NULL,
        artist           TEXT NOT NULL,
        album_image_url  TEXT,
        duration_ms      INTEGER,
        genre            TEXT DEFAULT 'Unknown',
        listened_at      TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE listening_history ADD COLUMN IF NOT EXISTS genre TEXT DEFAULT 'Unknown';
      
      CREATE TABLE IF NOT EXISTS user_playlists (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          title TEXT NOT NULL DEFAULT 'Новый плейлист',
          created_at TIMESTAMPTZ DEFAULT now()
      );
      
      CREATE TABLE IF NOT EXISTS user_playlist_tracks (
          playlist_id UUID REFERENCES user_playlists(id) ON DELETE CASCADE,
          track_id TEXT NOT NULL,
          track_data JSONB NOT NULL,
          position INTEGER NOT NULL DEFAULT 0,
          added_at TIMESTAMPTZ DEFAULT now(),
          PRIMARY KEY (playlist_id, track_id)
      );
    `);

    // Auto-update updated_at on row change
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS users_updated_at ON users;
      CREATE TRIGGER users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    console.log("[migrate] ✓ Schema updated: users, liked_tracks, saved_playlists, listening_history");

    // ── Rate limiting buckets (PostgreSQL token bucket) ───────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        key         TEXT        NOT NULL,
        tokens      REAL        NOT NULL DEFAULT 0,
        last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (key)
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_rate_limit_key ON rate_limit_buckets(key);`);
    console.log("[migrate] ✓ rate_limit_buckets ready");

    // ── Critical indices (user_id lookup paths) ───────────────────────────────
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_liked_tracks_user_id    ON liked_tracks(user_id);
      CREATE INDEX IF NOT EXISTS idx_liked_tracks_user_track ON liked_tracks(user_id, track_id);
      CREATE INDEX IF NOT EXISTS idx_listening_history_user  ON listening_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_listening_history_user_time ON listening_history(user_id, listened_at DESC);
      CREATE INDEX IF NOT EXISTS idx_listening_history_track ON listening_history(track_id);
      CREATE INDEX IF NOT EXISTS idx_listening_history_time  ON listening_history(listened_at DESC);
      CREATE INDEX IF NOT EXISTS idx_saved_playlists_user    ON saved_playlists(user_id);
    `);
    console.log("[migrate] ✓ Indices ready");

    // ── track_cache — normalised YouTube metadata ─────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS track_cache (
        track_id        TEXT        PRIMARY KEY,
        title           TEXT        NOT NULL,
        artist          TEXT        NOT NULL,
        album_image_url TEXT,
        duration_ms     INTEGER     DEFAULT 0,
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_track_cache_updated ON track_cache(updated_at DESC);`);
    console.log("[migrate] ✓ track_cache ready");
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("[migrate] Error:", err);
  process.exit(1);
});
