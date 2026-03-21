/**
 * lib/logger.ts — Server-safe structured logger for Vesper.
 *
 * ⚠️  SERVER ONLY — do NOT import in Client Components ("use client").
 *     For client-side errors, use plain console.error() sparingly.
 *
 * In production: debug + info messages are suppressed.
 * In development: all levels are emitted with ISO timestamp.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV === 'development';

function log(level: LogLevel, message: string, data?: unknown): void {
    // Suppress verbose levels in production
    if (!isDev && (level === 'debug' || level === 'info')) return;

    const timestamp = new Date().toISOString();
    const prefix = `[Vesper ${level.toUpperCase()}] ${timestamp}`;

    const consoleFn = level === 'debug' ? console.log : console[level];
    if (data !== undefined) {
        consoleFn(`${prefix}: ${message}`, data);
    } else {
        consoleFn(`${prefix}: ${message}`);
    }
}

export const logger = {
    debug: (msg: string, data?: unknown) => log('debug', msg, data),
    info:  (msg: string, data?: unknown) => log('info',  msg, data),
    warn:  (msg: string, data?: unknown) => log('warn',  msg, data),
    error: (msg: string, data?: unknown) => log('error', msg, data),
};
