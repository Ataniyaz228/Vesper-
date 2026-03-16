/**
 * migrate.ts — One-shot migration script
 * Run with: npx tsx src/lib/migrate.ts
 * Creates the users table if it doesn't exist.
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { Pool } from "pg";

async function migrate() {
  console.log("[migrate] Starting...");

  // 1. Create database if it doesn't exist by connecting to default 'postgres' db
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing in environment variables.");
  }

  const match = connectionString.match(/^(postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/)([^?]+)/);
  if (match) {
    const baseUri = match[1];
    const dbName = match[2];

    // Connect to the default 'postgres' database
    const tempPool = new Pool({ connectionString: `${baseUri}postgres` });
    try {
      const res = await tempPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [dbName]
      );
      if (res.rowCount === 0) {
        console.log(`[migrate] Database '${dbName}' does not exist. Creating it...`);
        // CREATE DATABASE cannot run securely with parameterized queries
        await tempPool.query(`CREATE DATABASE "${dbName}"`);
        console.log(`[migrate] Database '${dbName}' created.`);
      }
    } catch (e) {
      console.warn("[migrate] Could not ensure database exists:", e);
    } finally {
      await tempPool.end();
    }
  }

  // Connect to the actual database now that it's created
  const pool = new Pool({ connectionString });

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

    console.log("[migrate] ✓ Schema updated: users, liked_tracks, saved_playlists");
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("[migrate] Error:", err);
  process.exit(1);
});
