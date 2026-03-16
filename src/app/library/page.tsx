"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion";
import { Play, Heart, Disc3, ArrowRight, ListMusic, Search, LayoutGrid, List, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { AuraTrackImage } from "@/components/ui/AuraTrackImage";
import { MiniWave } from "@/components/ui/MiniWave";
import { Track, Playlist } from "@/lib/youtube";

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

function cleanTitle(raw: string) {
    return raw
        .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
        .replace(/\s*[-–~|]\s*(official|video|audio|lyrics|music video|top hits|top songs|trending|playlist|songs|\d{4}).*$/i, "")
        .replace(/\s*[\[\(].*?[\]\)]/g, "")
        .trim() || raw.slice(0, 48);
}


// ── 3D COVER PARALLAX SHOWCASE ──────────────────────────────────────────────
function CoverShowcase({ items }: { items: (Track | Playlist)[] }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const yRotate = useTransform(scrollYProgress, [0, 1], [-15, 15]);
    const xMove = useTransform(scrollYProgress, [0, 1], [-100, 100]);

    if (items.length === 0) return null;

    // Use up to 3 cover images to build a cool floating collage
    const images = items.slice(0, 3).map(i => ("imageUrl" in i ? i.imageUrl : i.albumImageUrl));

    return (
        <div ref={ref} className="absolute top-0 right-0 w-1/2 h-full opacity-40 pointer-events-none perspective-[1000px] flex items-center justify-end pr-20 overflow-hidden hide-scrollbar">
            {images.map((src, i) => (
                <motion.div
                    key={i}
                    style={{
                        rotateY: yRotate, x: xMove,
                        z: i * -200, scale: 1 - i * 0.1, marginLeft: i === 0 ? 0 : -300
                    }}
                    className="relative w-[400px] h-[400px] rounded-3xl overflow-hidden shrink-0 shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5"
                >
                    {src && <img src={src} className="w-full h-full object-cover saturate-0 brightness-50" />}
                </motion.div>
            ))}
        </div>
    );
}

// ── COMPACT TRACK ROW ─────────────────────────────────────────────────────
function CompactTrackRow({ track, index, isActive, isPlaying, isLoading, onClick }: { track: Track; index: number; isActive: boolean; isPlaying: boolean; isLoading: boolean; onClick: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.01, 0.2) }}
            onClick={onClick}
            className={`group flex items-center gap-4 px-4 py-2 cursor-pointer rounded-lg hover:bg-white/[0.04] transition-all border border-transparent ${isActive ? "bg-white/[0.06] border-white/5" : ""}`}
        >
            <div className="w-8 flex-shrink-0 flex justify-center items-center">
                {isActive ? <MiniWave active={isPlaying && !isLoading} /> : <span className="text-[10px] tabular-nums font-bold text-white/20 group-hover:text-white/60 transition-colors">{index + 1}</span>}
            </div>
            <div className="w-8 h-8 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                <AuraTrackImage
                    trackId={track.id}
                    fallbackUrl={track.albumImageUrl}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-white/80 group-hover:text-white"}`}>{track.title}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-tighter font-semibold truncate mt-0.5">{track.artist}</p>
            </div>
            <div className="flex items-center group-hover:opacity-100 opacity-0 transition-opacity">
                <Heart className="w-3.5 h-3.5 fill-white text-white" />
            </div>
        </motion.div>
    );
}

// ── EDITORIAL TRACK ROW ─────────────────────────────────────────────────────
function TrackRow({ track, index, isActive, isPlaying, isLoading, onClick }: { track: Track; index: number; isActive: boolean; isPlaying: boolean; isLoading: boolean; onClick: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
            onClick={onClick}
            whileHover={{ x: 12 }}
            className="group relative flex items-center justify-between w-full cursor-pointer py-6 border-b border-white/[0.04] pl-2 pr-8"
        >
            {isActive && (
                <div className="absolute left-0 top-6 bottom-6 w-1 rounded-full bg-white/20 blur-[2px]" />
            )}

            {/* Background highlight that sweeps across */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] to-transparent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />

            <div className="relative z-10 flex items-center gap-8 w-full">
                {/* Big typography number */}
                <div className="w-16 flex-shrink-0 flex justify-end">
                    {isActive ? (
                        <MiniWave active={isPlaying && !isLoading} />
                    ) : (
                        <span className="font-serif text-3xl italic text-white/20 group-hover:text-white/80 transition-colors">
                            {String(index + 1).padStart(2, "0")}
                        </span>
                    )}
                </div>

                {/* Art */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-2xl flex-shrink-0">
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors z-10 hidden sm:flex items-center justify-center">
                        {!isActive && <Play className="w-6 h-6 fill-white text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                    <AuraTrackImage
                        trackId={track.id}
                        fallbackUrl={track.albumImageUrl}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                </div>

                {/* Info */}
                <div className="flex flex-col min-w-0 flex-1 justify-center gap-1">
                    <h4 className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate transition-colors ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                        {cleanTitle(track.title)}
                    </h4>
                    <span className="text-xs sm:text-sm text-white/30 uppercase tracking-widest font-semibold truncate">
                        {track.artist}
                    </span>
                </div>

                {/* Action */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Heart className="w-5 h-5 fill-white text-white" />
                </div>
            </div>
        </motion.div>
    );
}

// ── PLAYLIST BENTO CARD ─────────────────────────────────────────────────────
function PlaylistBentoCard({ playlist, index, onClick }: { playlist: Playlist; index: number; onClick: () => void }) {
    const isLarge = index % 4 === 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClick}
            className={`group cursor-pointer relative rounded-[32px] overflow-hidden ${isLarge ? "col-span-1 md:col-span-2 row-span-2" : "col-span-1 row-span-1"}`}
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", minHeight: isLarge ? 400 : 250 }}
        >
            <div className="absolute inset-0 bg-black/50 z-10 group-hover:bg-black/20 transition-colors duration-500" />
            <div className="absolute inset-0 z-0">
                {playlist.imageUrl && <img src={playlist.imageUrl} alt="" className="w-full h-full object-cover saturate-50 group-hover:saturate-100 group-hover:scale-110 transition-all duration-1000" />}
            </div>

            {/* Info overlays */}
            <div className="absolute inset-0 z-20 flex flex-col p-8 justify-between">
                <div className="flex justify-between items-start">
                    <span className="backdrop-blur-xl bg-white/10 border border-white/20 text-white/80 text-[9px] uppercase tracking-[0.3em] font-bold px-3 py-1.5 rounded-full">
                        Playlist
                    </span>
                    <div className="w-12 h-12 rounded-full backdrop-blur-2xl bg-white/10 border border-white/20 flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                        <Play className="w-5 h-5 fill-white text-white ml-1" />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <h3 className={`font-black tracking-[-0.04em] text-white leading-[1.1] ${isLarge ? "text-3xl md:text-5xl max-w-[95%] line-clamp-3" : "text-xl md:text-2xl line-clamp-2"}`}>
                        {cleanTitle(playlist.title)}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="h-px w-4 bg-white/20" />
                        <p className={`text-white/60 font-medium ${isLarge ? "text-sm max-w-sm" : "text-[10px]"} line-clamp-1`}>
                            {playlist.tracks?.length || 0} tracks • Curated for you
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ── PLAYLIST GRID CARD (Simplified) ──────────────────────────────────────────
function PlaylistGridCard({ playlist, index, onClick }: { playlist: Playlist; index: number; onClick: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
            whileHover={{ y: -5 }}
            onClick={onClick}
            className="group cursor-pointer flex flex-col gap-4"
        >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                {playlist.imageUrl && (
                    <img src={playlist.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                )}
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/90 shadow-2xl flex items-center justify-center text-black translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-1" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-1 px-1">
                <h4 className="text-sm font-bold text-white group-hover:text-white/80 transition-colors truncate">
                    {cleanTitle(playlist.title)}
                </h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    {playlist.tracks?.length || 0} tracks
                </p>
            </div>
        </motion.div>
    );
}

// ── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function LibraryPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"editorial" | "compact">("editorial");

    // Playlist specific states
    const [playlistSearch, setPlaylistSearch] = useState("");
    const [playlistView, setPlaylistView] = useState<"bento" | "grid">("bento");

    const { likedTracks, savedPlaylists } = useLibraryStore();
    const { playTrack, currentTrack, isPlaying, isLoading } = usePlayerStore();

    const filteredTracks = likedTracks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPlaylists = savedPlaylists.filter(p =>
        p.title.toLowerCase().includes(playlistSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(playlistSearch.toLowerCase())
    );

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const isEmpty = likedTracks.length === 0 && savedPlaylists.length === 0;

    return (
        <div className="w-full min-h-screen bg-[#060608] text-white overflow-hidden pb-40">
            {/* Ambient Noise */}
            <div className="fixed inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none z-50" style={{ backgroundImage: NOISE }} />

            {/* ── IMMERSIVE EMPTY STATE ── */}
            {isEmpty ? (
                <div className="w-full h-screen flex flex-col items-center justify-center relative px-8">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_60%)]" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}
                        className="relative z-10 flex flex-col items-center text-center"
                    >
                        <div className="relative w-40 h-40 flex items-center justify-center mb-12">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-[1px] border-dashed border-white/20" />
                            <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute inset-[-20%] rounded-full border-[1px] border-white/5" />
                            <Disc3 className="w-12 h-12 text-white/40" />
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] mb-6">Silent<br /><span className="text-white/20">Vault</span></h1>
                        <p className="text-white/40 max-w-md text-sm md:text-base mb-10 leading-relaxed font-medium">
                            Your personal collection of soundscapes is currently empty. The void awaits your curation.
                        </p>

                        <button onClick={() => router.push("/discover")}
                            className="group relative px-8 py-4 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                            <div className="absolute inset-0 bg-white/5" />
                            <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                            <span className="relative z-10 text-xs tracking-[0.3em] font-bold uppercase flex items-center gap-3">
                                Discover Music
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </motion.div>
                </div>
            ) : (
                <div className="w-full flex flex-col pt-32">

                    {/* ── TITANIC HERO HEADER ── */}
                    <section className="relative px-8 lg:px-20 mb-32 h-[50vh] flex items-center">
                        <CoverShowcase items={[...savedPlaylists, ...likedTracks]} />

                        <div className="relative z-10 max-w-7xl mx-auto w-full">
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="flex flex-col">
                                <span className="text-[10px] tracking-[0.5em] text-white/30 uppercase font-bold mb-6 ml-2 block border-l border-white/20 pl-4 py-1">
                                    Your personal curation
                                </span>

                                <h1 className="flex flex-col text-[14vw] md:text-[10vw] uppercase font-black leading-[0.8] tracking-[-0.04em] mix-blend-difference z-20">
                                    <span className="text-transparent" style={{ WebkitTextStroke: "2px rgba(255,255,255,0.2)" }}>THE</span>
                                    <span className="text-white">VAULT</span>
                                </h1>
                            </motion.div>
                        </div>
                    </section>

                    {/* ── BENTO PLAYLISTS ── */}
                    {savedPlaylists.length > 0 && (
                        <section className="px-8 lg:px-20 mb-32 mx-auto max-w-screen-2xl w-full">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-white/10 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <ListMusic className="w-6 h-6 text-white/40" />
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="absolute -top-2 -right-3 px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-[9px] font-black text-white/40 tabular-nums"
                                        >
                                            {filteredPlaylists.length}
                                        </motion.div>
                                    </div>
                                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase italic">Collections</h2>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    {/* Playlist Search */}
                                    <div className="relative group min-w-[200px]">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white/60 transition-colors pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Find collection..."
                                            value={playlistSearch}
                                            onChange={(e) => setPlaylistSearch(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-11 pr-10 text-xs focus:outline-none focus:bg-white/[0.06] focus:border-white/10 transition-all"
                                        />
                                        {playlistSearch && (
                                            <button onClick={() => setPlaylistSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors">
                                                <X className="w-3 h-3 text-white/40" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Playlist View Switcher */}
                                    <div className="flex bg-white/[0.03] border border-white/5 p-1 rounded-2xl">
                                        <button
                                            onClick={() => setPlaylistView("bento")}
                                            className={`p-2 rounded-xl transition-all ${playlistView === "bento" ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"}`}
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setPlaylistView("grid")}
                                            className={`p-2 rounded-xl transition-all ${playlistView === "grid" ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"}`}
                                        >
                                            <ListMusic className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {filteredPlaylists.length > 0 ? (
                                <div className={playlistView === "bento"
                                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[250px]"
                                    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10"
                                }>
                                    {filteredPlaylists.map((pl, i) => (
                                        playlistView === "bento" ? (
                                            <PlaylistBentoCard key={pl.id} playlist={pl} index={i} onClick={() => router.push(`/playlist/${pl.id}`)} />
                                        ) : (
                                            <PlaylistGridCard key={pl.id} playlist={pl} index={i} onClick={() => router.push(`/playlist/${pl.id}`)} />
                                        )
                                    ))}
                                </div>
                            ) : playlistSearch && (
                                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                    <ListMusic className="w-12 h-12 mb-4" />
                                    <p className="text-xl font-bold italic uppercase tracking-widest">Collection not found</p>
                                </div>
                            )}
                        </section>
                    )}

                    {/* ── EDITORIAL TRACK LIST ── */}
                    <section className="px-4 sm:px-8 lg:px-20 mx-auto max-w-screen-xl w-full">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-white/10 pb-8">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <Heart className="w-6 h-6 text-[#f43f5e]" />
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="absolute -top-2 -right-3 px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-[9px] font-black text-white/60 tabular-nums"
                                    >
                                        {filteredTracks.length}
                                    </motion.div>
                                </div>
                                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase italic">Handpicked</h2>
                            </div>

                            {/* Control Bar */}
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Search */}
                                <div className="relative group min-w-[240px]">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white/60 transition-colors pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search Vault..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-11 pr-10 text-sm focus:outline-none focus:bg-white/[0.06] focus:border-white/10 transition-all backdrop-blur-3xl"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors"
                                        >
                                            <X className="w-3 h-3 text-white/40" />
                                        </button>
                                    )}
                                </div>

                                {/* View Switcher */}
                                <div className="flex bg-white/[0.03] border border-white/5 p-1 rounded-2xl backdrop-blur-3xl">
                                    <button
                                        onClick={() => setViewMode("editorial")}
                                        className={`p-2 rounded-xl transition-all ${viewMode === "editorial" ? "bg-white/10 text-white shadow-lg" : "text-white/20 hover:text-white/40"}`}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("compact")}
                                        className={`p-2 rounded-xl transition-all ${viewMode === "compact" ? "bg-white/10 text-white shadow-lg" : "text-white/20 hover:text-white/40"}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {filteredTracks.length > 0 ? (
                            <div className={viewMode === "compact" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1" : "flex flex-col"}>
                                {filteredTracks.map((track, i) => (
                                    viewMode === "editorial" ? (
                                        <TrackRow
                                            key={track.id}
                                            track={track}
                                            index={i}
                                            isActive={currentTrack?.id === track.id}
                                            isPlaying={isPlaying}
                                            isLoading={isLoading}
                                            onClick={() => playTrack(track, filteredTracks.slice(i))}
                                        />
                                    ) : (
                                        <CompactTrackRow
                                            key={track.id}
                                            track={track}
                                            index={i}
                                            isActive={currentTrack?.id === track.id}
                                            isPlaying={isPlaying}
                                            isLoading={isLoading}
                                            onClick={() => playTrack(track, filteredTracks.slice(i))}
                                        />
                                    )
                                ))}
                            </div>
                        ) : searchTerm && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <Search className="w-12 h-12 mb-4" />
                                <p className="text-xl font-bold italic uppercase tracking-widest">No soundscapes found</p>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
