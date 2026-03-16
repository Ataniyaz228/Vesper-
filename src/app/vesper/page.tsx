"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    motion, AnimatePresence, useSpring, useMotionValue,
    useTransform, useInView, useScroll, useVelocity,
    useMotionTemplate, animate,
} from "framer-motion";
import { Activity, Clock, Disc3, ArrowDown, Share2, Music2, Star, ChevronRight } from "lucide-react";
import { AuraDNAVisualizer } from "@/components/ui/AuraDNAVisualizer";

// ══════════════════════════════════════════════════════════════════
//  DATA — swap with API response; everything else auto-adapts
// ══════════════════════════════════════════════════════════════════
const AURA_DATA = {
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
const T = {
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
const ease = [0.16, 1, 0.3, 1] as const;

// ══════════════════════════════════════════════════════════════════
//  SHARED PRIMITIVES
// ══════════════════════════════════════════════════════════════════

// Viewport-triggered fade + slide-up
function Rise({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
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
function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
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
function Sep({ className = "" }: { className?: string }) {
    return <div className={`w-full h-px ${className}`} style={{ background: T.border }} />;
}

// Section label pill
function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] px-3 py-1.5 rounded-full ${className}`}
            style={{ background: T.glass, color: T.sub, border: `1px solid ${T.border}` }}
        >{children}</span>
    );
}

// Animated rolling number
function RollNum({ to, unit = "" }: { to: number; unit?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const in_ = useInView(ref, { once: true });
    useEffect(() => {
        if (!in_ || !ref.current) return;
        const ctrl = animate(0, to, { duration: 1.8, ease: "easeOut", onUpdate: v => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString(); } });
        return ctrl.stop;
    }, [in_, to]);
    return <><span ref={ref}>0</span>{unit && <span className="ml-1 text-[0.45em] font-normal opacity-40">{unit}</span>}</>;
}

// ══════════════════════════════════════════════════════════════════
function Hero({ d, dna }: {
    d: typeof AURA_DATA.identity & { lastResonated?: { title: string, artist: string } | null },
    dna?: any[]
}) {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 600], [0, 100]);
    const fade = useTransform(scrollY, [0, 400], [1, 0]);
    const dnaScale = useTransform(scrollY, [0, 600], [1, 1.2]);
    const dnaOpacity = useTransform(scrollY, [0, 400], [0.15, 0]);

    return (
        <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden"
            style={{ background: T.bg }}
        >
            {/* Subtle vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(255,255,255,0.015) 0%, transparent 70%)"
            }} />

            {/* Fine grain noise */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: T.noiseUrl }}
            />

            {/* Aura DNA background */}
            <motion.div
                style={{ y, scale: dnaScale, opacity: dnaOpacity }}
                className="absolute w-[800px] h-[800px] pointer-events-none z-0"
            >
                <AuraDNAVisualizer data={dna || AURA_DATA.genres} />
            </motion.div>

            {/* Slow-breathing ring */}
            <motion.div
                animate={{ scale: [1, 1.04, 1], opacity: [0.08, 0.14, 0.08] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
                style={{ border: `1px solid ${T.dim}`, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
            />
            <motion.div
                animate={{ scale: [1.06, 1, 1.06], opacity: [0.05, 0.09, 0.05] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[900px] h-[900px] rounded-full pointer-events-none"
                style={{ border: `1px solid ${T.dim}`, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
            />

            {/* Parallax text block */}
            <motion.div style={{ y, opacity: fade }} className="flex flex-col items-center text-center px-6 z-10 select-none">
                <Rise delay={0.1}>
                    <Label><Disc3 className="w-3 h-3" /> {d.tagline}</Label>
                </Rise>

                <Rise delay={0.22} className="mt-10">
                    <h1 className="font-black leading-[0.82] uppercase tracking-[-0.04em]"
                        style={{ fontSize: "clamp(3rem, 13vw, 11rem)", color: T.text }}>
                        Your<br />
                        <span style={{ color: T.sub }}>Vesper</span>
                    </h1>
                </Rise>

                <Rise delay={0.38} className="mt-8">
                    <p className="text-base max-w-sm leading-relaxed" style={{ color: T.sub }}>{d.description}</p>
                </Rise>

                <Rise delay={0.52} className="mt-10 flex flex-col items-center gap-4">
                    <div className="inline-flex items-center gap-2.5 text-xs font-semibold px-4 py-2 rounded-full"
                        style={{ background: T.glass, color: T.text, border: `1px solid ${T.border}` }}
                    >
                        <Star className="w-3.5 h-3.5" style={{ color: T.sub }} />
                        {d.badge}
                    </div>

                    {d.lastResonated && (
                        <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/20">
                            Last Resonated: <span className="text-white/40">{d.lastResonated.title}</span>
                        </p>
                    )}
                </Rise>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                animate={{ y: [0, 9, 0], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="absolute bottom-10 flex flex-col items-center gap-2"
            >
                <span className="text-[9px] font-mono uppercase tracking-[0.3em]" style={{ color: T.sub }}>Scroll</span>
                <ArrowDown className="w-4 h-4" style={{ color: T.dim }} />
            </motion.div>
        </section>
    );
}

// ══════════════════════════════════════════════════════════════════
//  2 — STAT GRID
// ══════════════════════════════════════════════════════════════════
function Stats({ data }: { data: typeof AURA_DATA.stats }) {
    return (
        <section className="px-5 md:px-12 py-24 max-w-[1500px] mx-auto">
            <Rise className="flex items-end justify-between mb-12">
                <div>
                    <Label><Activity className="w-3 h-3" /> Telemetry</Label>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-4" style={{ color: T.text }}>By the numbers</h2>
                </div>
            </Rise>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {data.map((s, i) => (
                    <Rise key={s.id} delay={0.08 * i}>
                        <Card className="p-7 h-[200px] md:h-[220px] flex flex-col justify-between group cursor-default">
                            {/* Top label */}
                            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: T.sub }}>
                                {String(i + 1).padStart(2, "0")} · {s.label}
                            </span>

                            {/* Value */}
                            <div>
                                <div className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-1.5" style={{ color: T.text }}>
                                    <RollNum to={s.value} unit={s.unit} />
                                </div>
                                <p className="text-sm" style={{ color: T.sub }}>{s.sub}</p>
                            </div>

                            {/* Hover glow */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[24px]"
                                style={{ background: "radial-gradient(circle at 70% 90%, rgba(255,255,255,0.04) 0%, transparent 65%)" }}
                            />
                        </Card>
                    </Rise>
                ))}
            </div>
        </section>
    );
}

// ══════════════════════════════════════════════════════════════════
//  3 — GENRE DNA
// ══════════════════════════════════════════════════════════════════
function GenreDNA({ genres }: { genres: typeof AURA_DATA.genres }) {
    return (
        <section className="px-5 md:px-12 pb-24 max-w-[1500px] mx-auto">
            <Rise>
                <Card className="p-8 md:p-10">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <Label>Sonic Identity</Label>
                            <h3 className="text-2xl font-black tracking-tight mt-4" style={{ color: T.text }}>Genre DNA</h3>
                        </div>
                    </div>
                    <Sep className="mb-8" />

                    <div className="flex flex-col gap-6">
                        {genres.map((g, i) => (
                            <div key={g.name} className="flex items-center gap-4">
                                <span className="w-5 text-[10px] font-mono text-right shrink-0" style={{ color: T.dim }}>
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="w-40 md:w-56 text-sm font-medium shrink-0 truncate" style={{ color: T.text }}>
                                    {g.name}
                                </span>
                                <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: T.dim }}>
                                    <motion.div className="h-full rounded-full"
                                        style={{ background: T.text }}
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${g.pct}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.2, delay: 0.08 * i, ease: "easeOut" }}
                                    />
                                </div>
                                <span className="w-8 text-right text-[10px] font-mono shrink-0" style={{ color: T.sub }}>
                                    {g.pct}%
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </Rise>
        </section>
    );
}

// ══════════════════════════════════════════════════════════════════
//  4 — TRACK LIST
// ══════════════════════════════════════════════════════════════════
function TrackList({ tracks }: { tracks: typeof AURA_DATA.tracks }) {
    const [hover, setHover] = useState<number | null>(null);

    return (
        <section className="px-5 md:px-12 pb-24 max-w-[1100px] mx-auto">
            <Rise className="flex items-end justify-between mb-12">
                <div>
                    <Label><Music2 className="w-3 h-3" /> Archive</Label>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-4" style={{ color: T.text }}>Heavy Rotation</h2>
                </div>
                <span className="text-sm font-mono hidden md:block" style={{ color: T.sub }}>2026</span>
            </Rise>

            <div className="flex flex-col" onMouseLeave={() => setHover(null)}>
                {tracks.map((t, i) => {
                    const on = hover === t.id;
                    return (
                        <Rise key={`${t.id}-${i}`} delay={0.05 * i}>
                            <>
                                {i === 0 && <Sep />}
                                <motion.div
                                    onMouseEnter={() => setHover(t.id)}
                                    animate={{ backgroundColor: on ? T.glass : "transparent" }}
                                    transition={{ duration: 0.25 }}
                                    className="group relative flex items-center justify-between px-4 py-4 rounded-xl cursor-default"
                                >
                                    {/* Left cluster */}
                                    <div className="flex items-center gap-5 min-w-0">
                                        {/* Index */}
                                        <motion.span
                                            animate={{ color: on ? T.text : T.dim }}
                                            className="font-mono text-xs w-5 shrink-0 text-right hidden sm:block"
                                        >{String(i + 1).padStart(2, "0")}</motion.span>

                                        {/* Thumb */}
                                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0"
                                            style={{ boxShadow: `0 4px 12px -4px rgba(0,0,0,0.7), inset 0 0 0 1px ${T.border}` }}
                                        >
                                            <img src={t.img} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 transition-opacity duration-400"
                                                style={{ background: "rgba(0,0,0,0.35)", opacity: on ? 0 : 1 }}
                                            />
                                        </div>

                                        {/* Title / artist */}
                                        <div className="min-w-0">
                                            <motion.p
                                                animate={{ x: on ? 4 : 0 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                                className="font-semibold text-base md:text-lg truncate" style={{ color: T.text }}
                                            >{t.title}</motion.p>
                                            <motion.p
                                                animate={{ x: on ? 4 : 0 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.02 }}
                                                className="text-sm truncate" style={{ color: T.sub }}
                                            >{t.artist}</motion.p>
                                        </div>
                                    </div>

                                    {/* Right cluster */}
                                    <div className="flex items-center gap-4 pl-4 shrink-0">
                                        {/* EQ bars */}
                                        <motion.div
                                            animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.75 }}
                                            transition={{ duration: 0.25 }}
                                            className="hidden md:flex items-end gap-[3px] h-4"
                                        >
                                            {[1, 2, 3, 4, 5].map(b => (
                                                <motion.div key={b}
                                                    style={{ background: T.text, width: 3, borderRadius: 2 }}
                                                    animate={{ height: on ? ["35%", "100%", "35%"] : "35%" }}
                                                    transition={{ duration: 0.45 + b * 0.09, repeat: on ? Infinity : 0 }}
                                                />
                                            ))}
                                        </motion.div>
                                        <span className="font-mono text-xs hidden sm:block" style={{ color: T.sub }}>{t.dur}</span>
                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: T.text }} />
                                    </div>
                                </motion.div>
                                <Sep />
                            </>
                        </Rise>
                    );
                })}
            </div>
        </section>
    );
}

// ══════════════════════════════════════════════════════════════════
//  5 — HOLOGRAM CARD (3-D tilt + glare)
// ══════════════════════════════════════════════════════════════════
function AuraCard({ identity, stats, genres }: { identity: any; stats: any; genres: any[] }) {
    const ref = useRef<HTMLDivElement>(null);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 100, damping: 25 });
    const sy = useSpring(my, { stiffness: 100, damping: 25 });

    // Smooth axial tilt
    const rX = useTransform(sy, [-0.5, 0.5], ["12deg", "-12deg"]);
    const rY = useTransform(sx, [-0.5, 0.5], ["-12deg", "12deg"]);

    // Parallax displacements
    const tX = useTransform(sx, [-0.5, 0.5], ["-8px", "8px"]);
    const tY = useTransform(sy, [-0.5, 0.5], ["-8px", "8px"]);

    // Holographic glare - rainbow shift
    const glareX = useTransform(sx, [-0.5, 0.5], ["100%", "0%"]);
    const glareY = useTransform(sy, [-0.5, 0.5], ["100%", "0%"]);

    const getGenreColor = (name: string, alpha: number = 0.5) => {
        let hash = 0;
        if (name) {
            for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        return `hsla(${h}, 70%, 65%, ${alpha})`;
    };

    const topGenreColor = genres && genres.length > 0 ? getGenreColor(genres[0].name, 0.2) : "rgba(255,255,255,0.05)";

    return (
        <section className="px-5 md:px-12 pb-48 flex flex-col items-center relative overflow-hidden" style={{ background: T.bg }}>
            {/* Background Atmosphere */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square opacity-20 blur-[120px] pointer-events-none"
                style={{ background: `radial-gradient(circle, ${topGenreColor} 0%, transparent 70%)` }} />

            <Rise className="text-center mb-20 relative z-10">
                <Label>Physicality</Label>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mt-4 italic uppercase" style={{ color: T.text }}>
                    The 2026 Artifact
                </h2>
                <p className="text-[10px] font-mono tracking-[0.2em] mt-4 opacity-30 uppercase">
                    Model: Vesper-v1.0 // Auth: Approved
                </p>
            </Rise>

            <Rise delay={0.2}>
                <motion.div
                    ref={ref}
                    onMouseMove={e => {
                        if (!ref.current) return;
                        const r = ref.current.getBoundingClientRect();
                        mx.set((e.clientX - r.left) / r.width - 0.5);
                        my.set((e.clientY - r.top) / r.height - 0.5);
                    }}
                    onMouseLeave={() => { mx.set(0); my.set(0); }}
                    style={{ rotateX: rX, rotateY: rY, transformStyle: "preserve-3d", perspective: 1500 }}
                    className="relative cursor-none group"
                >
                    {/* Card Container */}
                    <div className="w-[310px] sm:w-[380px] aspect-[1/1.42] rounded-[32px] overflow-hidden relative border border-white/10"
                        style={{
                            background: "#0d0d0f",
                            boxShadow: "0 100px 150px -50px rgba(0,0,0,1)",
                            transform: "translateZ(0px)"
                        }}
                    >
                        {/* 1. Internal Light Leaks (Genre Driven) */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {genres?.slice(0, 2).map((g, i) => (
                                <motion.div key={g.name}
                                    animate={{
                                        x: [0, 40, -40, 0],
                                        y: [0, -30, 30, 0],
                                        scale: [1, 1.2, 0.9, 1],
                                        opacity: [0.15, 0.25, 0.15]
                                    }}
                                    transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
                                    className="absolute w-full h-full blur-[80px]"
                                    style={{
                                        background: getGenreColor(g.name, 0.6),
                                        left: i === 0 ? '-30%' : '30%',
                                        top: i === 0 ? '-20%' : '40%'
                                    }}
                                />
                            ))}
                        </div>

                        {/* 2. Technical Blueprint Grid */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{ backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

                        {/* 3. Noise & Screen Texture */}
                        <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
                            style={{ backgroundImage: T.noiseUrl }} />

                        {/* 4. Iridescent Holographic Glare */}
                        <motion.div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-color-dodge"
                            style={{ background: useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, hsla(${Math.abs(Math.random() * 360)}, 100%, 70%, 0.3) 0%, transparent 60%)` }}
                        />

                        {/* ────── CONTENT ────── */}
                        <div className="relative h-full p-10 flex flex-col justify-between z-20">
                            {/* TOP BAR */}
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#3affaa] shadow-[0_0_10px_#3affaa] animate-pulse" />
                                        <span className="text-[9px] font-mono tracking-widest text-[#3affaa] uppercase">Live Channel</span>
                                    </div>
                                    <span className="block text-[10px] font-mono opacity-30 mt-1 uppercase tracking-tighter">Serial: VES-0026-{new Date().getFullYear()}</span>
                                </div>
                                <div className="p-2.5 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
                                    <Disc3 className="w-4 h-4 opacity-40 animate-spin-slow" />
                                </div>
                            </div>

                            {/* CENTER BLOCK */}
                            <motion.div style={{ x: tX, y: tY }} className="transition-transform duration-100 ease-out">
                                <div className="mb-4">
                                    <Label className="text-[8px] opacity-40 tracking-[0.3em]">Sonic Class</Label>
                                    <h3 className="text-5xl font-black italic tracking-[-0.05em] leading-[0.82] uppercase mt-2 mix-blend-difference"
                                        style={{ color: T.text, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15))' }}>
                                        {identity.name.split(" ").map((w: string, i: number) => (
                                            <span key={i} className="block">{w === "Architect" ? <span className="opacity-40">{w}</span> : w}</span>
                                        ))}
                                    </h3>
                                </div>
                                <div className="w-12 h-0.5 bg-white/10" />
                            </motion.div>

                            {/* STATS CONTROL PANEL */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                {stats.slice(0, 4).map((s: any) => (
                                    <div key={s.id} className="group/stat">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="w-1 h-1 rounded-full bg-white/20" />
                                            <p className="text-[8px] font-mono uppercase tracking-widest opacity-30">{s.label}</p>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-mono font-bold tracking-tighter tabular-nums" style={{ color: T.text }}>
                                                {s.value.toLocaleString()}
                                            </span>
                                            <span className="text-[8px] font-mono opacity-20 uppercase">{s.unit || "px"}</span>
                                        </div>
                                        <div className="w-full h-[1px] bg-white/[0.03] mt-2 group-hover/stat:bg-white/10 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BOTTOM DECOR */}
                        <div className="absolute bottom-4 left-10 right-10 flex justify-between items-center opacity-20 pointer-events-none">
                            <span className="text-[7px] font-mono uppercase tracking-[0.4em]">Proprietary Engine</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-0.5 h-0.5 rounded-full bg-white" />)}
                            </div>
                        </div>
                    </div>

                    {/* INTERACTIVE CUSTOM CURSOR (Inside Card Area) */}
                    <motion.div
                        className="absolute inset-0 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ x: mx, y: my }}
                    >
                        <div className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 border border-white/20 rounded-full" />
                        <div className="absolute w-[1px] h-4 -translate-x-1/2 -translate-y-1/2 bg-white/40 left-1/2" />
                        <div className="absolute h-[1px] w-4 -translate-x-1/2 -translate-y-1/2 bg-white/40 top-1/2" />
                    </motion.div>

                    {/* SHARE CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-max"
                        style={{ transform: "translateZ(80px)" }}
                    >
                        <button className="px-8 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-110 active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                            Export Artifact
                        </button>
                    </motion.div>
                </motion.div>
            </Rise>
        </section>
    );
}

// ══════════════════════════════════════════════════════════════════
//  PAGE ROOT
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
//  PAGE ROOT
// ══════════════════════════════════════════════════════════════════
export default function AuraPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/stats/summary");
                const stats = await res.json();
                if (stats.error) {
                    setIsLoading(false);
                    return;
                }
                setData(stats);
            } catch (e) {
                console.error("Failed to load stats", e);
            } finally {
                setTimeout(() => setIsLoading(false), 1500);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b]">
                <motion.span className="w-12 h-12 rounded-full block"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                    style={{ border: `1.5px solid rgba(255,255,255,0.12)`, borderTopColor: "rgba(255,255,255,0.45)" }}
                />
                <p className="mt-6 text-[10px] font-mono uppercase tracking-[0.28em] animate-pulse text-white/40">Compiling your vesper…</p>
            </div>
        );
    }

    const hasData = !!(data?.stats && data.stats.totalPlays > 0);

    // Adaptive time calculation
    const totalSec = data?.stats?.totalSeconds || 0;
    const timeVal = totalSec < 3600 ? Math.round(totalSec / 60) : Number((totalSec / 3600).toFixed(1));
    const timeUnit = totalSec < 3600 ? "min" : "hrs";

    const displayStats = hasData ? [
        {
            id: "time",
            label: "Total Time",
            value: timeVal,
            unit: timeUnit,
            sub: "of active listening"
        },
        {
            id: "plays",
            label: "Total Plays",
            value: data.stats.totalPlays || 0,
            unit: "",
            sub: data.stats.totalPlays === 1 ? "honest track completion" : "honest track completions"
        },
        {
            id: "tracks",
            label: "Unique Tracks",
            value: data.stats.uniqueTracks || 0,
            unit: "",
            sub: data.stats.uniqueTracks === 1 ? "distinct soundscape" : "distinct soundscapes"
        },
        {
            id: "streak",
            label: "Active Days",
            value: data.stats.activeDays || 0,
            unit: "d",
            sub: "out of the last 30"
        },
    ] : AURA_DATA.stats;

    const displayTracks = hasData ? data.topTracks : AURA_DATA.tracks;

    const identity = {
        ...AURA_DATA.identity,
        name: hasData ? (data?.topArtists?.[0]?.name || "Sonic Architect") : AURA_DATA.identity.name,
        description: hasData
            ? `Built from your collective resonance and honest listening sessions.`
            : `Your sonic journey is just beginning. Start resonance to build your Vesper.`,
        lastResonated: data?.stats?.lastResonated || null
    };

    const dnaData = data?.topGenres?.map((g: any) => ({
        name: g.name,
        pct: Math.round((g.count / data.stats.totalPlays) * 100)
    })) || AURA_DATA.genres;

    return (
        <main className="w-full min-h-screen font-sans overflow-x-hidden pb-40" style={{ background: T.bg, color: T.text }}>
            <div className="fixed inset-0 z-[200] pointer-events-none opacity-[0.018] mix-blend-overlay"
                style={{ backgroundImage: T.noiseUrl }}
            />

            <Hero d={identity} dna={dnaData} />

            {!hasData && (
                <section className="px-5 md:px-12 py-20 flex flex-col items-center text-center relative z-20">
                    <div className="max-w-2xl px-8 py-12 rounded-[32px] border border-white/5 bg-white/[0.02] backdrop-blur-md">
                        <Label>Initialisation</Label>
                        <h2 className="text-3xl font-black mt-6 mb-4 italic uppercase tracking-tighter">Awaiting Signal...</h2>
                        <p className="text-white/40 text-sm leading-relaxed mb-8">
                            Vesper uses <span className="text-white/80 font-bold">Honest Listening</span> logic.
                            Your statistics only count when you truly connect with a track—meaning no skips, no noise, just pure playback.
                            Finish a few songs to see your Sonic Fingerprint here.
                        </p>
                        <button
                            onClick={() => window.location.href = '/discover'}
                            className="px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl"
                        >
                            Begin Exploration
                        </button>
                    </div>
                </section>
            )}

            <div className={hasData ? "opacity-100" : "opacity-20 grayscale pointer-events-none transition-all duration-1000"}>
                <Stats data={displayStats} />

                {data?.topGenres && data.topGenres.length > 0 && (
                    <GenreDNA genres={dnaData} />
                )}

                <TrackList tracks={displayTracks} />
                <AuraCard identity={identity} stats={displayStats} genres={dnaData} />
            </div>
        </main>
    );
}
