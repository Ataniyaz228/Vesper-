"use client";

import React, { useRef, useEffect } from "react";
import { motion, useInView, animate } from "framer-motion";

// ══════════════════════════════════════════════════════════════════
//  DATA — swap with API response; everything else auto-adapts
// ══════════════════════════════════════════════════════════════════
export const AURA_DATA = {
    identity: {
        name: "Neon Melancholy",
        tagline: "Your 2026 Sonic Fingerprint",
        description: "Built from 365 days of heavy rotation, deep cuts, and skipped intros.",
        badge: "Top 2% Listener",
    },
    stats: [
        { id: "time", label: "Total Time", value: 842, unit: "hrs", sub: "of music consumed" },
        { id: "tempo", label: "Avg Tempo", value: 112, unit: "bpm", sub: "mid-range atmospheric" },
        { id: "tracks", label: "Unique Tracks", value: 1340, unit: "", sub: "distinct songs played" },
        { id: "streak", label: "Day Streak", value: 89, unit: "d", sub: "consecutive active days" },
    ],
    genres: [
        { name: "Neo-Psychedelia", pct: 85 },
        { name: "Synthwave", pct: 72 },
        { name: "Alternative R&B", pct: 64 },
        { name: "Indie Pop", pct: 45 },
        { name: "Dream Pop", pct: 38 },
    ],
    tracks: [
        { id: 1, title: "Midnight City", artist: "M83", dur: "4:03", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600" },
        { id: 2, title: "Nights", artist: "Frank Ocean", dur: "5:07", img: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=600" },
        { id: 3, title: "The Less I Know", artist: "Tame Impala", dur: "3:36", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600" },
        { id: 4, title: "Starboy", artist: "The Weeknd", dur: "3:50", img: "https://images.unsplash.com/photo-1614680376408-81e91fafff1c?q=80&w=600" },
        { id: 5, title: "Pink + White", artist: "Frank Ocean", dur: "3:04", img: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600" },
        { id: 6, title: "God Only Knows", artist: "Beach Boys", dur: "2:50", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=600" },
    ],
};

// ══════════════════════════════════════════════════════════════════
//  DESIGN TOKEN — one object, nothing hardcoded elsewhere
// ══════════════════════════════════════════════════════════════════
export const T = {
    bg: "#09090b",
    card: "#111113",
    border: "rgba(255,255,255,0.05)",
    glass: "rgba(255,255,255,0.03)",
    text: "rgba(255,255,255,0.90)",
    sub: "rgba(255,255,255,0.45)",
    dim: "rgba(255,255,255,0.12)",
    glow: "rgba(255,255,255,0.04)",
    shadow: "0 24px 64px -16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.05)",
    noiseUrl: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
};

export const ease = [0.16, 1, 0.3, 1] as const;

// ══════════════════════════════════════════════════════════════════
//  SHARED PRIMITIVES
// ══════════════════════════════════════════════════════════════════

// Viewport-triggered fade + slide-up
export function Rise({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const in_ = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.div ref={ref} className={className}
            initial={{ opacity: 0, y: 48 }}
            animate={in_ ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.0, delay, ease }}
        >{children}</motion.div>
    );
}

// Glass card container
export function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return (
        <div className={`relative overflow-hidden rounded-[24px] ${className}`}
            style={{ background: T.card, boxShadow: T.shadow, ...style }}
        >
            {/* Subtle noise texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay"
                style={{ backgroundImage: T.noiseUrl }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
}

// Thin separator
export function Sep({ className = "" }: { className?: string }) {
    return <div className={`w-full h-px ${className}`} style={{ background: T.border }} />;
}

// Section label pill
export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] px-3 py-1.5 rounded-full ${className}`}
            style={{ background: T.glass, color: T.sub, border: `1px solid ${T.border}` }}
        >{children}</span>
    );
}

// Animated rolling number
export function RollNum({ to, unit = "" }: { to: number; unit?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const in_ = useInView(ref, { once: true });
    useEffect(() => {
        if (!in_ || !ref.current) return;
        const ctrl = animate(0, to, { duration: 1.8, ease: "easeOut", onUpdate: v => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString(); } });
        return ctrl.stop;
    }, [in_, to]);
    return <><span ref={ref}>0</span>{unit && <span className="ml-1 text-[0.45em] font-normal opacity-40">{unit}</span>}</>;
}
