"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useMetadataStore } from "@/store/useMetadataStore";

import { MiniWave } from "@/components/ui/MiniWave";
import { cn, cleanTitle } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────
function formatTime(s: number) {
    if (isNaN(s) || s < 0) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function AmbientGlow({ imageUrl }: { imageUrl?: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div key={imageUrl} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }} className="absolute inset-0 pointer-events-none overflow-hidden rounded-[32px]">
                {imageUrl && (
                    <img src={imageUrl} alt="" aria-hidden
                        className="absolute object-cover opacity-20 blur-2xl saturate-200 scale-125"
                        style={{ inset: "-20%" }} />
                )}
            </motion.div>
        </AnimatePresence>
    );
}

export const GlobalAudioPlayer = () => {
    const { currentTrack, isPlaying, isLoading, progress, duration, volume, togglePlay, nextTrack, prevTrack, setVolume, seekTo, setTrackArt } = usePlayerStore();
    const { toggleLikeTrack, isTrackLiked } = useLibraryStore();
    const liked = currentTrack ? isTrackLiked(currentTrack.id) : false;

    // Enhance cover art lazily when track changes
    useEffect(() => {
        if (!currentTrack) return;

        const fetchArt = async () => {
            // Check if we already have it in store
            const existing = useMetadataStore.getState().enhancedCovers[currentTrack.id];
            if (existing) {
                // If it already exists in global store but NOT in current player state, sync it
                if (existing !== currentTrack.albumImageUrl) {
                    setTrackArt(currentTrack.id, existing);
                }
                return;
            }

            const isLowRes = currentTrack.albumImageUrl?.includes("ytimg.com");
            if (!isLowRes) return;

            try {
                const res = await fetch(`/api/metadata/art?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`);
                const data = await res.json();
                if (data.url && data.url !== currentTrack.albumImageUrl) {
                    setTrackArt(currentTrack.id, data.url);
                    // Also save to global metadata registry for ALL components
                    useMetadataStore.getState().setEnhancedCover(currentTrack.id, data.url);
                }
            } catch (e) {
                console.error("[ArtEnhance] Failed:", e);
            }
        };
        fetchArt();
    }, [currentTrack, setTrackArt]);

    const [localProg, setLocalProg] = useState(progress);
    const [isDrag, setIsDrag] = useState(false);
    const [hover, setHover] = useState(false);
    const [showVol, setShowVol] = useState(false);
    const barRef = useRef<HTMLDivElement>(null);
    const volTout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        let isMount = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!isDrag && isMount) setLocalProg(progress);
        return () => { isMount = false; }
    }, [progress, isDrag]);

    const pct = duration ? Math.min(100, (localProg / duration) * 100) : 0;

    // Seek on any mouse interaction with the progress bar area
    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!barRef.current || !duration) return;
        const r = barRef.current.getBoundingClientRect();
        const val = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        seekTo(val * duration);
        setLocalProg(val * duration);
    };

    const toggleVol = () => {
        clearTimeout(volTout.current);
        setShowVol(v => {
            if (!v) volTout.current = setTimeout(() => setShowVol(false), 3000);
            return !v;
        });
    };

    if (!currentTrack) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 100, opacity: 0, x: "-50%" }}
            transition={{ type: "spring", damping: 26, stiffness: 200 }}
            className="fixed bottom-8 left-[calc(50%+155px)] w-[calc(100%-360px)] max-w-4xl z-50"
            style={{ willChange: "transform" }}
        >
            <div className="relative rounded-[32px] flex flex-col border border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-[0_24px_64px_rgba(0,0,0,0.5)]">

                <AmbientGlow imageUrl={currentTrack.albumImageUrl} />

                {/* ── Main row ── */}
                <div onClick={() => usePlayerStore.getState().toggleFullScreen()} className="relative z-10 flex items-center gap-4 px-4 pt-3.5 pb-3 cursor-pointer group">

                    {/* Album art */}
                    <AnimatePresence mode="popLayout">
                        <motion.div key={currentTrack.id}
                            initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }}
                            transition={{ duration: 0.35 }}
                            className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"
                            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)" }}>
                            {currentTrack.albumImageUrl && (
                                <img src={currentTrack.albumImageUrl} alt="" className="w-full h-full object-cover" />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                        <AnimatePresence mode="wait">
                            <motion.span key={currentTrack.id}
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                className="text-[13px] font-semibold text-white truncate leading-tight">
                                {cleanTitle(currentTrack.title)}
                            </motion.span>
                        </AnimatePresence>
                        <div className="flex items-center gap-2 mt-0.5">
                            <MiniWave active={isPlaying && !isLoading} />
                            <span className="text-[11px] text-white/32 truncate">{currentTrack.artist}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 mx-2 flex-shrink-0">
                        <motion.button
                            onClick={(e) => { e.stopPropagation(); prevTrack(); }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            <SkipBack className="w-4 h-4 fill-current" />
                        </motion.button>

                        <motion.button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            whileHover={{ scale: 1.07 }}
                            whileTap={{ scale: 0.91 }}
                            className="w-10 h-10 rounded-full bg-white flex items-center justify-center transition-transform"
                            style={{ boxShadow: "0 0 20px rgba(255,255,255,0.15), 0 4px 10px rgba(0,0,0,0.4)" }}
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 fill-black text-black" />
                            ) : (
                                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                            )}
                        </motion.button>

                        <motion.button
                            onClick={(e) => { e.stopPropagation(); nextTrack(); }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            <SkipForward className="w-4 h-4 fill-current" />
                        </motion.button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (currentTrack) toggleLikeTrack(currentTrack);
                            }}
                            className="ml-1 group"
                        >
                            <Heart
                                className={cn(
                                    "w-[18px] h-[18px] transition-all duration-300",
                                    liked
                                        ? "fill-[#f43f5e] text-[#f43f5e] drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                                        : "text-white/20 group-hover:text-white/40"
                                )}
                            />
                        </button>
                    </div>

                    {/* Time + Volume */}
                    <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                        <span className="text-[10px] font-mono text-white/22 tabular-nums whitespace-nowrap">
                            {formatTime(localProg)}<span className="mx-0.5 text-white/10">/</span>{formatTime(duration)}
                        </span>

                        <div className="relative group/vol" onClick={(e) => e.stopPropagation()}>
                            <motion.button onClick={toggleVol} whileHover={{ scale: 1.1 }}
                                className="text-white/40 hover:text-white transition-colors p-1.5 bg-white/5 rounded-lg">
                                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </motion.button>

                            <AnimatePresence>
                                {showVol && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.9 }}
                                        transition={{ duration: 0.18 }}
                                        className="absolute bottom-full right-0 mb-3 px-4 py-3 rounded-2xl flex items-center gap-2.5 border border-white/8"
                                        style={{ background: "rgba(16,16,20,0.97)", backdropFilter: "blur(32px)", boxShadow: "0 8px 32px rgba(0,0,0,0.7)", width: 148 }}
                                        onMouseEnter={() => clearTimeout(volTout.current)}
                                        onMouseLeave={() => { volTout.current = setTimeout(() => setShowVol(false), 600); }}>
                                        <VolumeX className="w-3 h-3 text-white/20 flex-shrink-0" />
                                        <div className="relative flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer overflow-hidden">
                                            <div className="h-full bg-white/80 rounded-full" style={{ width: `${volume * 100}%` }} />
                                            <input type="range" min={0} max={1} step={0.01} value={volume}
                                                onChange={e => setVolume(parseFloat(e.target.value))}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                        </div>
                                        <Volume2 className="w-3 h-3 text-white/20 flex-shrink-0" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* ──────── PROGRESS BAR ──────── */}
                <div ref={barRef}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => { setHover(false); setIsDrag(false); }}
                    onMouseDown={(e) => { setIsDrag(true); seek(e); }}
                    onMouseMove={(e) => { if (isDrag) seek(e); }}
                    onMouseUp={() => setIsDrag(false)}
                    onClick={seek}
                    className="relative z-10 flex items-center cursor-pointer select-none"
                    style={{ height: 16, paddingLeft: 16, paddingRight: 16, marginTop: -2 }}
                >
                    {/* Track */}
                    <div className="absolute inset-x-4 rounded-full bg-white/5" style={{ height: hover ? 2 : 1, top: "50%", transform: "translateY(-50%)", transition: "height 0.3s ease" }} />
                    {/* Fill */}
                    <div className="absolute rounded-full bg-white/60" style={{ height: hover ? 2 : 1, left: 16, width: `calc(${pct}% - 16px)`, top: "50%", transform: "translateY(-50%)", transition: "height 0.3s ease", maxWidth: "calc(100% - 32px)" }} />
                    {/* Scrubber dot */}
                    <motion.div className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                        initial={{ scale: 0 }}
                        animate={{ scale: hover ? 1 : 0 }}
                        style={{ width: 8, height: 8, left: `calc(${pct}% + 16px - 4px)`, top: "50%", translateY: "-50%" }}
                        transition={{ duration: 0.2 }}
                    />
                </div>

            </div>
        </motion.div>
    );
};
