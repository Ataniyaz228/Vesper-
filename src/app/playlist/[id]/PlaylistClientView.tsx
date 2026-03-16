"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Heart, Pause } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { AuraTrackImage } from "@/components/ui/AuraTrackImage";
import { MiniWave } from "@/components/ui/MiniWave";
import { Playlist, Track } from "@/lib/youtube";

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

import { cleanTitle } from "@/lib/utils";


// ── Single track row ──────────────────────────────────────────────
function Row({ track, index, isActive, isPlaying, isLoading, onClick }: {
    track: Track; index: number; isActive: boolean; isPlaying: boolean; isLoading: boolean; onClick: () => void;
}) {
    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ x: 6, transition: { duration: 0.3 } }}
            className="group flex items-center gap-4 px-5 py-3.5 cursor-pointer rounded-xl hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.04]"
        >
            {/* Index / waveform */}
            <div className="w-8 flex items-center justify-center flex-shrink-0">
                {isActive ? (
                    <MiniWave active={isPlaying && !isLoading} />
                ) : (
                    <span className={`text-[11px] tabular-nums font-semibold transition-opacity ${isActive ? "text-white/80" : "text-white/18 group-hover:opacity-0"}`}>
                        {String(index + 1).padStart(2, "0")}
                    </span>
                )}
                {!isActive && (
                    <Play className="w-3.5 h-3.5 fill-white text-white absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>

            {/* Thumb */}
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/[0.05]">
                <AuraTrackImage
                    trackId={track.id}
                    fallbackUrl={track.albumImageUrl}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
            </div>

            {/* Info */}
            <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-[13px] font-semibold truncate transition-colors ${isActive ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                    {track.title}
                </span>
                <span className="text-white/30 text-[11px] truncate mt-0.5">{track.artist}</span>
            </div>

            {/* Active indicator bar */}
            {isActive && (
                <div className="w-1 h-6 rounded-full bg-white/60 flex-shrink-0" />
            )}
        </motion.div>
    );
}

// ── Page ───────────────────────────────────────────────────────────
export function PlaylistClientView({ playlist }: { playlist: Playlist }) {
    const router = useRouter();
    const { playTrack, currentTrack, isPlaying, isLoading, togglePlay } = usePlayerStore();
    const { toggleSavePlaylist, isPlaylistSaved } = useLibraryStore();
    const isSaved = isPlaylistSaved(playlist.id);
    const heroRef = useRef<HTMLDivElement>(null);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);
    const { scrollY } = useScroll();
    // Header parallax: image moves up as you scroll
    const imgY = useSpring(useTransform(scrollY, [0, 400], [0, -80]), { stiffness: 80, damping: 20 });
    const imgScale = useSpring(useTransform(scrollY, [0, 400], [1, 1.08]), { stiffness: 80, damping: 20 });
    const headerOpacity = useTransform(scrollY, [0, 280], [1, 0]);
    // Sticky mini-header reveals when scroll > 320
    const miniHeaderY = useSpring(useTransform(scrollY, [280, 340], ["-100%", "0%"]), { stiffness: 200, damping: 30 });

    const handlePlay = (track: Track, i: number) => playTrack(track, playlist.tracks.slice(i));
    const handlePlayAll = () => playlist.tracks.length > 0 && playTrack(playlist.tracks[0], playlist.tracks);
    const isCurrentPlaylistPlaying = playlist.tracks.some(t => t.id === currentTrack?.id) && isPlaying;

    return (
        <div className="relative w-full min-h-full text-white">

            {/* ══════════════ STICKY MINI HEADER ══════════════ */}
            <motion.div
                className="fixed top-0 left-0 right-0 z-40 flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]"
                style={{ background: "rgba(10,10,12,0.85)", backdropFilter: "blur(32px)", y: miniHeaderY }}
            >
                <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center hover:bg-white/12 transition-all flex-shrink-0">
                    <ArrowLeft className="w-4 h-4 text-white/70" />
                </button>
                <span className="text-sm font-bold text-white truncate flex-1">{cleanTitle(playlist.title)}</span>
                <button onClick={isCurrentPlaylistPlaying ? togglePlay : handlePlayAll}
                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-all flex-shrink-0">
                    {isCurrentPlaylistPlaying ? <Pause className="w-4 h-4 fill-black text-black" /> : <Play className="w-4 h-4 fill-black text-black ml-0.5" />}
                </button>
            </motion.div>

            {/* ══════════════ CINEMATIC HERO ══════════════ */}
            <div ref={heroRef} className="relative overflow-hidden" style={{ height: "clamp(340px, 50vh, 500px)" }}>
                {/* Parallax image */}
                <motion.div className="absolute inset-0" style={{ y: imgY, scale: imgScale }}>
                    {playlist.imageUrl ? (
                        <img src={playlist.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-900 to-black" />
                    )}
                </motion.div>

                {/* Film grain */}
                <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none" style={{ backgroundImage: NOISE }} />

                {/* Gradient */}
                <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, rgba(10,10,12,1) 100%)" }} />

                {/* Back button */}
                <motion.button
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 z-10 w-9 h-9 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", opacity: headerOpacity }}>
                    <ArrowLeft className="w-4 h-4 text-white/70" />
                </motion.button>

                {/* Hero text (bottom-left) */}
                <motion.div style={{ opacity: headerOpacity }} className="absolute bottom-0 left-0 right-0 px-7 pb-8 z-10">
                    <span className="text-[9px] tracking-[0.46em] text-white/30 uppercase font-semibold block mb-2">Playlist</span>
                    <h1 className="font-black tracking-[-0.04em] leading-[1.02] text-white line-clamp-3"
                        style={{ fontSize: "clamp(24px, 4.5vw, 62px)" }}>
                        {cleanTitle(playlist.title)}
                    </h1>
                    <p className="text-white/25 text-[11px] mt-2 line-clamp-1 max-w-md">
                        {playlist.description || `${playlist.tracks.length} tracks`}
                    </p>
                </motion.div>
            </div>

            {/* ══════════════ ACTION BAR ══════════════ */}
            <div className="flex items-center gap-5 px-7 py-5">
                {/* Play / Pause */}
                <motion.button
                    onClick={isCurrentPlaylistPlaying ? togglePlay : handlePlayAll}
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: "0 0 40px rgba(255,255,255,0.18), 0 4px 20px rgba(0,0,0,0.4)" }}>
                    <AnimatePresence mode="wait">
                        {isCurrentPlaylistPlaying ? (
                            <motion.div key="pause" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                                <Pause className="w-5 h-5 fill-black text-black" />
                            </motion.div>
                        ) : (
                            <motion.div key="play" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                                <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* Save */}
                <motion.button onClick={() => toggleSavePlaylist(playlist)}
                    whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full border flex items-center justify-center transition-all"
                    style={{
                        borderColor: (mounted && isSaved) ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.08)",
                        background: (mounted && isSaved) ? "rgba(139,92,246,0.12)" : "transparent"
                    }}>
                    <Heart className={`w-4 h-4 transition-colors ${(mounted && isSaved) ? "fill-violet-400 text-violet-400" : "text-white/40"}`} />
                </motion.button>

                {/* Stats */}
                <div className="flex-1 flex flex-col gap-0.5 min-w-0 pl-2">
                    <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-semibold">Tracks</span>
                    <span className="text-[13px] text-white/50 font-bold">{playlist.tracks.length}</span>
                </div>
            </div>

            {/* ══════════════ DIVIDER ══════════════ */}
            <div className="h-px mx-7 bg-white/[0.05] mb-2" />

            {/* ══════════════ TRACK LIST ══════════════ */}
            <div className="flex flex-col px-2 pb-40">
                {playlist.tracks.length > 0 ? (
                    playlist.tracks.map((track, idx) => (
                        <Row
                            key={`${track.id}-${idx}`}
                            track={track}
                            index={idx}
                            isActive={currentTrack?.id === track.id}
                            isPlaying={isPlaying}
                            isLoading={isLoading}
                            onClick={() => handlePlay(track, idx)}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                        <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center text-2xl opacity-40">💿</div>
                        <p className="text-white/30 text-sm max-w-xs leading-relaxed">
                            This playlist might be private or a dynamic mix. No tracks available.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
