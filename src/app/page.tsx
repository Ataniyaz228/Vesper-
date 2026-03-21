"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Play, X } from "lucide-react";
import { TrackRow } from "@/components/ui/TrackRow";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useRouter, useSearchParams } from "next/navigation";
import { Playlist, Track } from "@/lib/youtube";
import { useAuthStore } from "@/store/useAuthStore";

// ── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  if (h < 23) return "Добрый вечер";
  return "Поздний вечер";
}

import { cleanTitle } from "@/lib/utils";
import { NOISE_URL as NOISE } from "@/lib/constants";

// Unsplash backdrop image for hero when YouTube thumb is ugly
const HERO_FALLBACK = "/pins/pin1.png";

import { Reveal, SectionHeader, Marquee } from "@/components/home/Shared";
import { ShelfCard } from "@/components/home/ShelfCard";
import { DragShelf } from "@/components/home/DragShelf";
import { MoodPanel, MOODS } from "@/components/home/MoodPanel";
import { NowPlayingEditorial } from "@/components/home/NowPlayingEditorial";
import { ChartRow } from "@/components/home/ChartRow";

// ── Page ──────────────────────────────────────────────────────────────────────
function HomeContent() {
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { user } = useAuthStore();

  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const [trendingRes, searchRes] = await Promise.all([
          fetch("/api/trending"),
          fetch(`/api/search?q=top songs ${new Date().getFullYear()} official video`),
        ]);
        if (trendingRes.ok) { const d: Playlist[] = await trendingRes.json(); setHero(d[2] ?? d[0] ?? null); setShelf(d.filter((_, i) => i !== 2).slice(0, 8)); }
        if (searchRes.ok) { const t: Track[] = await searchRes.json(); setTrending(t.slice(0, 5)); }
      } catch (err) { console.error('[Home] Failed to load trending/search data', err); } finally { setLoadingShelf(false); }
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

  const handleSearchChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 450);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

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
                className="text-xs tracking-[0.48em] text-white/22 uppercase font-semibold">{getGreeting()}
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-3 ml-auto">
            <AnimatePresence mode="wait">
              {searchOpen ? (
                <motion.form key="f" initial={{ opacity: 0, scaleX: 0.5, originX: 1 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0, scaleX: 0.5 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={(e) => { e.preventDefault(); doSearch(query); }}
                  className="flex items-center gap-2.5 rounded-full px-4 py-2.5 border border-white/10 backdrop-blur-2xl"
                  style={{ background: "rgba(255,255,255,0.07)", width: "clamp(200px,28vw,380px)" }}>
                  <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <input ref={inputRef} value={query}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Songs, artists, playlists…"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/22 focus:outline-none min-w-0" />
                  <button type="button" onClick={closeSearch} className="text-white/22 hover:text-white/60 transition-colors flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                </motion.form>
              ) : (
                <motion.button key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={openSearch}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-xl"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Search className="w-4 h-4 text-white/55" />
                </motion.button>
              )}
            </AnimatePresence>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold tracking-widest cursor-pointer hover:scale-105 transition-transform flex-shrink-0">{user?.username.slice(0, 2).toUpperCase() ?? "??"}</div>
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
                  <span className="text-xs tracking-[0.46em] text-white/30 uppercase font-semibold">Featured</span>
                </div>
                <h1 className="font-black tracking-[-0.04em] leading-[1.03] text-white"
                  style={{ fontSize: "clamp(22px, 3.8vw, 56px)" }}>
                  {hero ? cleanTitle(hero.title) : "Your Music, Elevated"}
                </h1>
                <p className="text-white/30 text-xs max-w-[320px] leading-relaxed">
                  Handpicked sounds from across the globe, renewed daily.
                </p>
              </div>
              <button onClick={() => hero && router.push(`/playlist/${hero.id}`)}
                className="flex items-center gap-2 text-xs font-bold px-6 py-3.5 rounded-full flex-shrink-0 bg-white text-black hover:scale-105 active:scale-95 transition-all"
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
              <div className="flex flex-col rounded-[22px] overflow-hidden border border-white/[0.04] backdrop-blur-3xl"
                style={{ background: "rgba(255,255,255,0.024)" }}>
                {results.map((t, i) => (
                  <TrackRow key={t.id} index={i + 1} track={t} title={t.title} artist={t.artist}
                    duration="--:--" isActive={currentTrack?.id === t.id} onClick={() => handlePlay(t, i)} />
                ))}
              </div>
            ) : query.trim() ? (
              <div className="flex justify-center py-14 text-white/18 text-xs tracking-widest uppercase">Nothing found</div>
            ) : (
              <div className="flex justify-center py-14 text-white/10 text-xs tracking-widest uppercase">Start typing</div>
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
                <div className="mx-8 rounded-[22px] overflow-hidden border border-white/[0.04] backdrop-blur-2xl"
                  style={{ background: "rgba(255,255,255,0.022)" }}>
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

export default function Home() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-[#09090b]" />}>
      <HomeContent />
    </Suspense>
  );
}
