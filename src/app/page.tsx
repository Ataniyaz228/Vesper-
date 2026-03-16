"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  motion, AnimatePresence,
  useMotionValue, useSpring, useTransform,
  useInView,
} from "framer-motion";
import { Search, Loader2, Play, X, ArrowRight } from "lucide-react";
import { TrackRow } from "@/components/ui/TrackRow";
import { AuraTrackImage } from "@/components/ui/AuraTrackImage";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useRouter, useSearchParams } from "next/navigation";
import { Playlist, Track } from "@/lib/youtube";

// ── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still awake";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}
function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*[-–|:]\s*(official|video|audio|lyrics|playlist|music|youtube|hd|4k|mix|songs|new songs).*$/i, "")
    .replace(/\s*(playlist|mix|official).*$/i, "")
    .replace(/\s*[\[\(].*?[\]\)]/g, "")
    .replace(/\d{4}.*$/, "").trim().slice(0, 44) || raw.slice(0, 44);
}
const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// Unsplash backdrop image for hero when YouTube thumb is ugly
const HERO_FALLBACK = "/pins/pin1.png";

// ── Reveal on scroll ──────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

// ── Shelf card ────────────────────────────────────────────────────────────────
function ShelfCard({ item, index, onClick }: { item: Playlist; index: number; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0); const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 130, damping: 24 });
  const sy = useSpring(my, { stiffness: 130, damping: 24 });
  const rX = useTransform(sy, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rY = useTransform(sx, [-0.5, 0.5], ["-8deg", "8deg"]);
  const gX = useTransform(sx, [-0.5, 0.5], ["115%", "-15%"]);
  const gY = useTransform(sy, [-0.5, 0.5], ["115%", "-15%"]);
  const w = "clamp(148px, 16vw, 208px)";
  return (
    <motion.div ref={ref}
      onMouseMove={(e) => { if (!ref.current) return; const r = ref.current.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      onClick={onClick}
      style={{ rotateX: rX, rotateY: rY, transformStyle: "preserve-3d", perspective: 900, flexShrink: 0 }}
      whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 280, damping: 24 } }}
      className="cursor-pointer group relative"
    >
      <div className="absolute -top-6 left-0 text-[10px] font-black text-white/10 tabular-nums select-none">{String(index + 1).padStart(2, "0")}</div>
      <div className="absolute -bottom-4 left-[14%] right-[14%] h-6 pointer-events-none opacity-0 group-hover:opacity-55 transition-opacity duration-500"
        style={{ background: "rgba(100,60,200,0.5)", filter: "blur(14px)", borderRadius: "50%" }} />
      <div className="relative bg-[#0e0e0e]"
        style={{
          width: w, aspectRatio: "1", borderRadius: 16, overflow: "hidden",
          boxShadow: "0 12px 40px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)", transform: "translateZ(20px)"
        }}>
        {item.imageUrl && <img src={item.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 55%)" }} />
        <motion.div className="absolute inset-0 mix-blend-soft-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `radial-gradient(circle at ${gX} ${gY}, rgba(255,255,255,0.42) 0%, transparent 58%)` }} />
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 z-10">
          <p className="text-white text-[11px] font-semibold line-clamp-2 leading-[1.3]">{cleanTitle(item.title)}</p>
        </div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-50 group-hover:scale-100">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xl">
            <Play className="w-3 h-3 fill-black ml-0.5" />
          </div>
        </div>
      </div>
      <div className="mt-2.5 px-0.5" style={{ width: w }}>
        <p className="text-white/25 text-[10px] font-medium line-clamp-1">{cleanTitle(item.title)}</p>
      </div>
    </motion.div>
  );
}

// ── Smooth drag carousel ──────────────────────────────────────────────────────
function DragShelf({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const raw = useMotionValue(0);
  const x = useSpring(raw, { stiffness: 55, damping: 18, mass: 0.85 });

  const clamp = (v: number) => {
    if (!contentRef.current || !containerRef.current) return v;
    return Math.min(0, Math.max(-(contentRef.current.scrollWidth - containerRef.current.offsetWidth + 64), v));
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => { e.preventDefault(); raw.set(clamp(raw.get() - e.deltaY * 0.5)); };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, []);

  return (
    <div ref={containerRef} className="overflow-hidden w-full" style={{ paddingLeft: 32, paddingRight: 32, cursor: "grab" }}>
      <motion.div ref={contentRef} drag="x" dragConstraints={containerRef}
        style={{ x }} dragTransition={{ bounceStiffness: 55, bounceDamping: 20 }} dragElastic={0.05}
        whileTap={{ cursor: "grabbing" }} className="flex gap-6 w-max pb-2 pt-8">
        {children}
      </motion.div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-end px-8 gap-4 mb-7">
      <div><span className="block text-[9px] tracking-[0.44em] text-white/14 uppercase font-semibold">{eyebrow}</span>
        <h2 className="text-[16px] font-bold tracking-[-0.025em] text-white/85 mt-0.5">{title}</h2></div>
      <div className="flex-1 h-px bg-white/[0.05] mb-1" />
    </div>
  );
}

// ── Animated waveform ─────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = [3, 5, 8, 6, 4, 7, 5, 3];
  return (
    <div className="flex items-end gap-[2px] h-4">
      {bars.map((h, i) => (
        <motion.div key={i} className="w-[2px] rounded-full"
          style={{ backgroundColor: active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.14)" }}
          animate={active ? { height: [h * 2, h * 3.2, h * 1.4, h * 2.8, h * 2] } : { height: h * 2 }}
          transition={active ? { duration: 1.0, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" } : {}} />
      ))}
    </div>
  );
}

// ── Infinite marquee ──────────────────────────────────────────────────────────
function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden w-full relative py-4">
      <div className="absolute inset-y-0 left-0 w-20 z-10" style={{ background: "linear-gradient(to right, #0a0a0c, transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-20 z-10" style={{ background: "linear-gradient(to left, #0a0a0c, transparent)" }} />
      <motion.div animate={{ x: "-33.33%" }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }} className="flex gap-10 w-max">
        {doubled.map((name, i) => (
          <span key={i} className="text-white/10 text-[10px] uppercase tracking-[0.35em] font-semibold flex items-center gap-4">
            {name} <span className="w-[3px] h-[3px] rounded-full bg-white/10 inline-block" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── MOOD panels (editorial, image-based) ──────────────────────────────────────
const MOODS = [
  {
    label: "Focus",
    word: "DEEP",
    query: "focus study music concentration lo-fi",
    img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200&auto=format&fit=crop",
    accent: "#818cf8",
  },
  {
    label: "Energy",
    word: "MOVE",
    query: "high energy workout music",
    img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
    accent: "#fbbf24",
  },
  {
    label: "Chill",
    word: "EASE",
    query: "chill lo-fi evening relax music",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
    accent: "#34d399",
  },
];

function MoodPanel({ mood, onClick }: { mood: typeof MOODS[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex-1 overflow-hidden rounded-2xl cursor-pointer"
      style={{ minHeight: 200 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
    >
      {/* Real photo background */}
      <motion.img src={mood.img} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        animate={{ scale: hovered ? 1.08 : 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
      {/* Dark grade */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)" }} />
      {/* Accent glow */}
      <motion.div className="absolute inset-0 pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.5 }}
        style={{ background: `radial-gradient(ellipse at 50% 80%, ${mood.accent}22 0%, transparent 70%)` }} />
      {/* Giant background word */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.span className="font-black text-white select-none"
          animate={{ opacity: hovered ? 0.06 : 0.03, scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.6 }}
          style={{ fontSize: "clamp(64px, 10vw, 120px)", letterSpacing: "-0.05em" }}>
          {mood.word}
        </motion.span>
      </div>
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-5 pt-20">
        <span className="text-[9px] tracking-[0.4em] font-semibold uppercase mb-1" style={{ color: mood.accent + "cc" }}>
          {mood.label}
        </span>
        <p className="text-white font-bold text-[13px] leading-tight">
          {mood.word === "DEEP" ? "Get in the zone" : mood.word === "MOVE" ? "Turn it up" : "Wind down"}
        </p>
        <motion.div className="flex items-center gap-1.5 mt-3"
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -6 }} transition={{ duration: 0.35 }}>
          <span className="text-[10px] text-white/50 uppercase tracking-[0.2em]">Play now</span>
          <ArrowRight className="w-3 h-3 text-white/50" />
        </motion.div>
      </div>
    </motion.div >
  );
}

// ── Dynamic editorial CTA — reacts to currently playing track ─────────────────
function NowPlayingEditorial({ onDiscover }: { onDiscover: () => void }) {
  const { currentTrack, isPlaying } = usePlayerStore();
  const hasTrack = !!currentTrack && isPlaying;

  return (
    <div className="pt-16 px-8">
      <div className="relative overflow-hidden rounded-[28px] min-h-[220px]"
        style={{ border: "1px solid rgba(255,255,255,0.05)" }}>

        {/* ── Base dark gradient always visible ── */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #0a0814 0%, #120920 50%, #0a0a0c 100%)" }} />

        {/* ── Blurred album art bleeds through when track is playing ── */}
        <AnimatePresence mode="wait">
          {hasTrack && currentTrack?.albumImageUrl && (
            <motion.img
              key={currentTrack.id}
              src={currentTrack.albumImageUrl}
              alt="" aria-hidden
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.4 }}
              className="absolute object-cover saturate-150"
              style={{ inset: "-10%", width: "120%", height: "120%", filter: "blur(40px)", opacity: 0.35 }}
            />
          )}
        </AnimatePresence>

        {/* dark scrim so text stays readable */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%)" }} />

        {/* film grain */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: NOISE }} />

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col gap-5 px-10 py-11">

          {/* eyebrow changes */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8 max-w-[48px]" />
            <AnimatePresence mode="wait">
              {hasTrack ? (
                <motion.span key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[8px] tracking-[0.5em] text-white/35 uppercase font-semibold flex items-center gap-2">
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-white/50 inline-block"
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                  Now playing
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[8px] tracking-[0.5em] text-white/20 uppercase font-semibold">
                  Discover
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* headline */}
          <AnimatePresence mode="wait">
            {hasTrack ? (
              <motion.div key={currentTrack?.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-1.5">
                <h3 className="font-black text-white tracking-[-0.04em] leading-[1.02]"
                  style={{ fontSize: "clamp(20px, 3.2vw, 48px)" }}>
                  {cleanTitle(currentTrack?.title ?? "")}
                </h3>
                <p className="text-white/30 text-[12px] font-medium">{currentTrack?.artist}</p>
              </motion.div>
            ) : (
              <motion.h3 key="default"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="font-black text-white tracking-[-0.045em] leading-[1.02]"
                style={{ fontSize: "clamp(28px, 4.5vw, 60px)" }}>
                Your next<br />
                <span style={{ color: "rgba(255,255,255,0.18)" }}>obsession</span><br />
                awaits.
              </motion.h3>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.button onClick={onDiscover}
            whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35 hover:text-white/70 transition-colors w-fit group mt-1">
            Open Discover
            <div className="w-6 h-6 rounded-full border border-white/12 flex items-center justify-center group-hover:border-white/40 transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Charts row (editorial 01, 02 style) ────────────────────────────────────────
function ChartRow({ track, index, active, onClick }: { track: Track; index: number; active: boolean; onClick: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 4, transition: { duration: 0.3 } }}
      className="flex items-center gap-5 px-6 py-4 cursor-pointer group border-b border-white/[0.035] last:border-none hover:bg-white/[0.025] transition-colors"
    >
      {/* Big number */}
      <span className="font-black tabular-nums flex-shrink-0 select-none transition-colors duration-300"
        style={{ fontSize: "clamp(18px, 2.2vw, 28px)", letterSpacing: "-0.04em", color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)" }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/[0.06]">
        <AuraTrackImage
          trackId={track.id}
          fallbackUrl={track.albumImageUrl}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-white text-[12px] font-semibold truncate">{track.title}</span>
        <span className="text-white/30 text-[10px] truncate mt-0.5">{track.artist}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Waveform active={active} />
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { playTrack, currentTrack } = usePlayerStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hero, setHero] = useState<Playlist | null>(null);
  const [shelf, setShelf] = useState<Playlist[]>([]);
  const [trending, setTrending] = useState<Track[]>([]);
  const [loadingShelf, setLoadingShelf] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const [trendingRes, searchRes] = await Promise.all([
          fetch("/api/trending"),
          fetch("/api/search?q=top songs 2025 official video"),
        ]);
        if (trendingRes.ok) { const d: Playlist[] = await trendingRes.json(); setHero(d[2] ?? d[0] ?? null); setShelf(d.filter((_, i) => i !== 2).slice(0, 8)); }
        if (searchRes.ok) { const t: Track[] = await searchRes.json(); setTrending(t.slice(0, 5)); }
      } catch { } finally { setLoadingShelf(false); }
    })();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      setSearchOpen(true);
      doSearch(q);
    }
  }, [searchParams]);

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setIsSearching(true);
    try { const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`); setResults(await res.json()); }
    catch { setResults([]); } finally { setIsSearching(false); }
  };
  const openSearch = () => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 40); };
  const closeSearch = () => { setSearchOpen(false); setQuery(""); setResults([]); };
  const handlePlay = (t: Track, i: number) => playTrack(t, results.slice(i));
  const marqueeItems = trending.map(t => t.artist.split(",")[0].trim()).filter(Boolean);

  return (
    <div className="relative w-full min-h-full flex flex-col text-white">

      {/* ══════════════════ HERO ══════════════════ */}
      <motion.section
        animate={{ height: searchOpen ? 148 : "clamp(360px, 56vh, 560px)" }}
        transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full flex-shrink-0 overflow-hidden"
        style={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>

        {/* Use Unsplash hero OR playlist image — Unsplash always looks premium */}
        <AnimatePresence mode="popLayout">
          <motion.img
            key={hero?.id ?? "fallback"}
            src={HERO_FALLBACK}
            initial={{ opacity: 0, scale: 1.14 }} animate={{ opacity: 1, scale: 1.07 }} exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.6 }, scale: { duration: 18, ease: "linear" } }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            style={{ objectPosition: "center 40%" }}
          />
        </AnimatePresence>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 5%, rgba(0,0,0,0.65) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.48) 0%, transparent 35%, rgba(0,0,0,0.92) 100%)" }} />
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay" style={{ backgroundImage: NOISE }} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between px-8 pt-7">
          <AnimatePresence>
            {!searchOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[9px] tracking-[0.48em] text-white/22 uppercase font-semibold">{getGreeting()}
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-3 ml-auto">
            <AnimatePresence mode="wait">
              {searchOpen ? (
                <motion.form key="f" initial={{ opacity: 0, scaleX: 0.5, originX: 1 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0, scaleX: 0.5 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={(e) => { e.preventDefault(); doSearch(query); }}
                  className="flex items-center gap-2.5 rounded-full px-4 py-2.5 border border-white/10"
                  style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(28px)", width: "clamp(200px,28vw,380px)" }}>
                  <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <input ref={inputRef} value={query}
                    onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }}
                    placeholder="Songs, artists, playlists…"
                    className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/22 focus:outline-none min-w-0" />
                  <button type="button" onClick={closeSearch} className="text-white/22 hover:text-white/60 transition-colors flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                </motion.form>
              ) : (
                <motion.button key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={openSearch}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                  style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.06)" }}>
                  <Search className="w-4 h-4 text-white/55" />
                </motion.button>
              )}
            </AnimatePresence>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-[9px] font-bold tracking-widest cursor-pointer hover:scale-105 transition-transform flex-shrink-0">AT</div>
          </div>
        </div>

        {/* Hero content */}
        <AnimatePresence>
          {!searchOpen && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 left-0 right-0 z-10 px-8 pb-9 flex items-end justify-between gap-8">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-white/40"
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span className="text-[9px] tracking-[0.46em] text-white/30 uppercase font-semibold">Featured</span>
                </div>
                <h1 className="font-black tracking-[-0.04em] leading-[1.03] text-white"
                  style={{ fontSize: "clamp(22px, 3.8vw, 56px)" }}>
                  {hero ? cleanTitle(hero.title) : "Your Music, Elevated"}
                </h1>
                <p className="text-white/30 text-[11px] max-w-[320px] leading-relaxed">
                  Handpicked sounds from across the globe, renewed daily.
                </p>
              </div>
              <button onClick={() => hero && router.push(`/playlist/${hero.id}`)}
                className="flex items-center gap-2 text-[11px] font-bold px-6 py-3.5 rounded-full flex-shrink-0 bg-white text-black hover:scale-105 active:scale-95 transition-all"
                style={{ boxShadow: "0 0 40px rgba(255,255,255,0.2)" }}>
                <Play className="w-3 h-3 fill-current" />Listen
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ══════════ SEARCH ══════════ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }} className="px-8 pt-6 pb-4">
            {isSearching ? (
              <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 animate-spin text-white/25" /></div>
            ) : results.length > 0 ? (
              <div className="flex flex-col rounded-[22px] overflow-hidden border border-white/[0.04]"
                style={{ background: "rgba(255,255,255,0.024)", backdropFilter: "blur(32px)" }}>
                {results.map((t, i) => (
                  <TrackRow key={t.id} index={i + 1} track={t} title={t.title} artist={t.artist}
                    duration="--:--" isActive={currentTrack?.id === t.id} onClick={() => handlePlay(t, i)} />
                ))}
              </div>
            ) : query.trim() ? (
              <div className="flex justify-center py-14 text-white/18 text-[10px] tracking-widest uppercase">Nothing found</div>
            ) : (
              <div className="flex justify-center py-14 text-white/10 text-[10px] tracking-widest uppercase">Start typing</div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* ══════════ SCROLL JOURNEY ══════════ */}
      <AnimatePresence>
        {!searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            className="flex flex-col pb-44">

            {/* ── Marquee ── */}
            <Reveal><div className="pt-10"><Marquee items={marqueeItems.length > 0 ? marqueeItems : ["Arctic Monkeys", "Billie Eilish", "The Weeknd", "Kendrick", "Sabrina Carpenter", "Dua Lipa"]} /></div></Reveal>

            {/* ── For You Shelf ── */}
            <Reveal delay={0.05}>
              <div className="pt-14">
                <SectionHeader eyebrow="Curated" title="For You" />
                {loadingShelf ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-white/18" /></div> : (
                  <DragShelf>{shelf.map((item, i) => <ShelfCard key={item.id} item={item} index={i} onClick={() => router.push(`/playlist/${item.id}`)} />)}</DragShelf>
                )}
              </div>
            </Reveal>

            {/* ── Mood panels ── */}
            <Reveal delay={0.04}>
              <div className="pt-16 px-8">
                <SectionHeader eyebrow="Vibe" title="Choose Your Mood" />
                <div className="flex gap-3">
                  {MOODS.map((m) => (
                    <MoodPanel key={m.label} mood={m}
                      onClick={() => { setSearchOpen(true); setQuery(m.query); doSearch(m.query); }} />
                  ))}
                </div>
              </div>
            </Reveal>

            {/* ── Trending charts ── */}
            <Reveal delay={0.04}>
              <div className="pt-16">
                <SectionHeader eyebrow="Charts" title="Trending Right Now" />
                <div className="mx-8 rounded-[22px] overflow-hidden border border-white/[0.04]"
                  style={{ background: "rgba(255,255,255,0.022)", backdropFilter: "blur(24px)" }}>
                  {trending.length === 0 ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/20" /></div> : (
                    trending.map((t, i) => <ChartRow key={t.id} track={t} index={i} active={currentTrack?.id === t.id} onClick={() => playTrack(t, trending)} />)
                  )}
                </div>
              </div>
            </Reveal>

            {/* ── Editorial NowPlaying CTA ── */}
            <Reveal delay={0.02}>
              <NowPlayingEditorial onDiscover={() => router.push("/discover")} />
            </Reveal>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
