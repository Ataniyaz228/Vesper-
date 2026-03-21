"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePlayerUIStore } from "@/store/usePlayerUIStore";
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Heart, Volume2, VolumeX, Mic2, ListPlus, ListMusic } from "lucide-react";
import { AddToPlaylistPicker } from "@/components/playlists/AddToPlaylistPicker";
import { FastAverageColor } from "fast-average-color";
import { useLibraryStore } from "@/store/useLibraryStore";
import { AuraTrackImage } from "@/components/ui/AuraTrackImage";
import { SynchronizedLyrics } from "./SynchronizedLyrics";
import { cn, cleanTitle } from "@/lib/utils";

function formatTime(s: number) {
    if (isNaN(s) || s < 0) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

// ── Color Science ───────────────────────────────────────────────────────────
type RGB = { r: number, g: number, b: number };

function useDominantColor(imageUrl?: string, isReady?: boolean): RGB {
    const [color, setColor] = useState<RGB>({ r: 40, g: 40, b: 50 });

    useEffect(() => {
        if (!imageUrl || !isReady) return;

        const timeout = setTimeout(() => {
            const fac = new FastAverageColor();
            fac.getColorAsync(imageUrl, { algorithm: 'dominant' })
                .then(res => {
                    const [r, g, b] = res.value;
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    if (brightness < 30) {
                        setColor({ r: Math.min(255, r + 40), g: Math.min(255, g + 40), b: Math.min(255, b + 40) });
                    } else {
                        setColor({ r, g, b });
                    }
                })
                .catch(() => { });
        }, 500);

        return () => clearTimeout(timeout);
    }, [imageUrl, isReady]);

    return color;
}

// 1. Ambient Mood (Optimized radial gradients)
function AmbientBackground({ rgb, title }: { rgb: RGB, title: string }) {
    const centerGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`;
    const edgeGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#040405] pointer-events-none">
            <motion.div
                className="absolute rounded-full mix-blend-screen opacity-60"
                style={{
                    width: "160vw", height: "160vw",
                    top: "40%", left: "50%", x: "-50%", y: "-50%",
                    background: `radial-gradient(circle at center, ${centerGlow} 0%, ${edgeGlow} 40%, transparent 70%)`,
                    willChange: "transform"
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Giant Track Title Watermark */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center mix-blend-overlay opacity-[0.03] pointer-events-none">
                <motion.h1
                    className="text-[18vw] font-black uppercase tracking-[-0.05em] leading-none select-none whitespace-nowrap text-white text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                >
                    {title}
                </motion.h1>
            </div>

            <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        </div>
    );
}



export const FullScreenPlayer = () => {
    const {
        currentTrack,
        isPlaying,
        progress,
        duration,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        volume,
        setVolume,
    } = usePlayerStore();

    const { isFullScreenPlayerOpen, setFullScreen, toggleQueue, isQueueOpen } = usePlayerUIStore();

    const { toggleLikeTrack, isTrackLiked } = useLibraryStore();
    const liked = currentTrack ? isTrackLiked(currentTrack.id) : false;

    const [hover, setHover] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);
    const [isDrag, setIsDrag] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerAnchor, setPickerAnchor] = useState<DOMRect | undefined>(undefined);
    const barRef = useRef<HTMLDivElement>(null);
    const pct = duration ? Math.min(100, (progress / duration) * 100) : 0;

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!barRef.current || !duration) return;
        const r = barRef.current.getBoundingClientRect();
        const val = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        seekTo(val * duration);
    };

    const [isFullyVisible, setIsFullyVisible] = useState(false);
    const dominantColorRGB = useDominantColor(currentTrack?.albumImageUrl, isFullyVisible);

    // Reset visibility state when closed
    useEffect(() => {
        let isM = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!isFullScreenPlayerOpen && isM) setIsFullyVisible(false);
        return () => { isM = false; };
    }, [isFullScreenPlayerOpen]);

    return (
        <AnimatePresence>
            {isFullScreenPlayerOpen && currentTrack && (
                <motion.div
                    initial={{ y: "100%", opacity: 0.9 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0.9 }}
                    onAnimationComplete={() => setIsFullyVisible(true)}
                    transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                    className="fixed inset-0 z-[100] text-white overflow-hidden flex flex-col font-sans bg-[#040405]"
                    style={{ willChange: "transform", contain: "strict" }}
                >
                    <AmbientBackground rgb={dominantColorRGB} title={cleanTitle(currentTrack.title)} />

                    {/* 1. Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="relative z-30 flex items-center justify-between px-8 md:px-12 h-20 md:h-32 w-full shrink-0"
                    >
                        <button
                            onClick={() => setFullScreen(false)}
                            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all backdrop-blur-3xl shadow-lg group"
                        >
                            <ChevronDown className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                        </button>
                        <div />
                        <button
                            onClick={() => setShowLyrics(!showLyrics)}
                            className={cn(
                                "w-11 h-11 flex items-center justify-center rounded-full transition-all backdrop-blur-3xl shadow-lg border",
                                showLyrics
                                    ? "bg-white text-black border-white"
                                    : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/50 hover:text-white"
                            )}
                        >
                            <Mic2 className="w-5 h-5" />
                        </button>
                    </motion.div>

                    {/* 2. Content — Cover + Title centrally placed */}
                    <div className="relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
                        {/* Left panel — Cover art */}
                        <motion.div
                            animate={{
                                width: showLyrics ? "42%" : "100%",
                                opacity: 1,
                            }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full flex flex-col items-center justify-center shrink-0 origin-center relative will-change-[width] gap-4 py-4 px-8 md:px-12"
                        >
                            {/* Album Cover */}
                            <motion.div
                                layout
                                initial={false}
                                animate={{
                                    scale: showLyrics ? 0.88 : 1.02,
                                    rotate: showLyrics ? -1.5 : 0,
                                    y: showLyrics ? 0 : -4
                                }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className={cn(
                                    "relative aspect-square shrink-0 rounded-[48px] overflow-hidden shadow-2xl",
                                    "ring-1 ring-white/10 bg-[#0a0a0b]"
                                )}
                                style={{
                                    height: "min(52vh, 520px)",
                                    boxShadow: showLyrics
                                        ? `0 20px 50px -10px rgba(0,0,0,0.5), 0 0 30px rgba(${dominantColorRGB.r},${dominantColorRGB.g},${dominantColorRGB.b}, 0.15)`
                                        : `0 50px 120px -20px rgba(0,0,0,0.7), 0 20px 60px -10px rgba(${dominantColorRGB.r},${dominantColorRGB.g},${dominantColorRGB.b}, 0.3)`,
                                    WebkitMaskImage: '-webkit-radial-gradient(white, black)'
                                }}
                            >
                                <AuraTrackImage
                                    trackId={currentTrack.id}
                                    fallbackUrl={currentTrack.albumImageUrl}
                                    className="w-full h-full object-cover select-none scale-[1.01]"
                                />
                                {/* 1. Premium Glass Material Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-transparent pointer-events-none z-10" />
                                {/* 2. Dynamic Border Highlight (Top Left) */}
                                <div className="absolute inset-0 rounded-[48px] border border-white/[0.08] pointer-events-none z-20" />
                                {/* 3. Vignette/Depth */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05)_0%,transparent_50%)] pointer-events-none z-10" />
                                {/* 4. Bottom Contrast Sink */}
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />
                            </motion.div>

                            {/* Track Identity */}
                            <motion.div
                                animate={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                className="flex flex-col items-center shrink-0"
                            >
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-white line-clamp-1">
                                    {cleanTitle(currentTrack.title)}
                                </h2>
                                <p className="text-xs md:text-xs text-white/35 tracking-[0.2em] uppercase font-semibold mt-1.5">
                                    {currentTrack.artist}
                                </p>
                            </motion.div>
                        </motion.div>

                        {/* Right panel — Lyrics (slides in from the right) */}
                        <AnimatePresence>
                            {showLyrics && (
                                <motion.div
                                    key="lyrics-panel"
                                    initial={{ opacity: 0, x: 40, width: "0%" }}
                                    animate={{ opacity: 1, x: 0, width: "60%" }}
                                    exit={{ opacity: 0, x: 40, width: "0%" }}
                                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                                    className="h-full relative shrink-0"
                                >
                                    <SynchronizedLyrics
                                        title={cleanTitle(currentTrack.title)}
                                        artist={currentTrack.artist}
                                        className="w-full h-full"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 3. Footer */}
                    <div className="relative z-30 w-full flex flex-col items-center gap-4 md:gap-6 shrink-0 pt-4 pb-6 md:pt-6 md:pb-10 px-8">


                        {/* Player Console */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
                            className="w-full max-w-4xl bg-white/[0.03] border border-white/[0.05] shadow-[0_32px_80px_rgba(0,0,0,0.4)] rounded-[24px] md:rounded-full px-6 py-3 md:px-10 md:py-3 flex flex-col md:flex-row items-center gap-6 md:gap-10"
                            style={{
                                backdropFilter: isFullyVisible ? "blur(40px)" : "none",
                                willChange: "transform, opacity"
                            }}
                        >
                            <div className="flex items-center gap-6 md:gap-8 order-2 md:order-1">
                                <button onClick={prevTrack} className="text-white/20 hover:text-white transition-colors">
                                    <SkipBack className="w-5 h-5 fill-current" />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className="w-12 h-12 md:w-14 md:h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                </button>
                                <button onClick={nextTrack} className="text-white/20 hover:text-white transition-colors">
                                    <SkipForward className="w-5 h-5 fill-current" />
                                </button>
                                <button
                                    onClick={() => currentTrack && toggleLikeTrack(currentTrack)}
                                    className="ml-2 hover:scale-110 active:scale-90 transition-transform group"
                                >
                                    <Heart
                                        className={cn(
                                            "w-6 h-6 transition-all duration-300",
                                            liked ? "fill-[#f43f5e] text-[#f43f5e] drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]" : "text-white/20 group-hover:text-white/50"
                                        )}
                                    />
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleQueue(); }}
                                    className={cn(
                                        "p-2 rounded-full transition-all hover:scale-110 active:scale-90",
                                        isQueueOpen
                                            ? "bg-white/12 text-white"
                                            : "text-white/20 hover:text-white/50"
                                    )}
                                    title="Очередь воспроизведения"
                                >
                                    <ListMusic className="w-6 h-6" />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPickerAnchor(e.currentTarget.getBoundingClientRect());
                                        setPickerOpen(p => !p);
                                    }}
                                    className={cn(
                                        "p-2 rounded-full transition-all hover:scale-110 active:scale-90",
                                        pickerOpen
                                            ? "bg-white/12 text-white"
                                            : "text-white/20 hover:text-white/50"
                                    )}
                                    title="Добавить в плейлист"
                                >
                                    <ListPlus className="w-6 h-6" />
                                </button>

                                {currentTrack && (
                                    <AddToPlaylistPicker
                                        track={currentTrack}
                                        open={pickerOpen}
                                        onClose={() => setPickerOpen(false)}
                                        anchorRect={pickerAnchor}
                                    />
                                )}
                            </div>

                            <div className="flex flex-col gap-2 flex-1 w-full order-1 md:order-2">
                                <div className="flex justify-between items-center px-1 font-mono text-xs tracking-widest opacity-20">
                                    <span>{formatTime(progress)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                                <div
                                    className="group relative h-4 flex items-center cursor-pointer"
                                    ref={barRef}
                                    onMouseEnter={() => setHover(true)}
                                    onMouseLeave={() => { setHover(false); setIsDrag(false); }}
                                    onMouseDown={(e) => { setIsDrag(true); handleSeek(e); }}
                                    onMouseMove={(e) => { if (isDrag) handleSeek(e); }}
                                    onMouseUp={() => setIsDrag(false)}
                                    onClick={handleSeek}
                                    style={{ touchAction: "none" }}
                                >
                                    <div className="absolute inset-x-0 h-[1.5px] bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-white/40" style={{ width: `${pct}%` }} />
                                    </div>
                                    <motion.div
                                        className="absolute h-2.5 w-2.5 bg-white rounded-full shadow-[0_0_10px_white]"
                                        animate={{ scale: hover || isDrag ? 1.3 : 0, opacity: hover || isDrag ? 1 : 0 }}
                                        style={{ left: `calc(${pct}% - 5px)` }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </div>
                            </div>

                            <div className="hidden md:flex items-center gap-3 w-32 shrink-0 order-3 bg-white/[0.04] px-3 py-2 rounded-full border border-white/[0.08]">
                                <button onClick={() => setVolume(volume === 0 ? 0.5 : 0)} className="text-white/40 hover:text-white transition-colors">
                                    {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                                <div className="relative flex-1 h-1 rounded-full bg-white/10 overflow-hidden cursor-pointer group/vol">
                                    <div className="h-full bg-white/40 rounded-full group-hover/vol:bg-white/60 transition-colors" style={{ width: `${volume * 100}%` }} />
                                    <input
                                        type="range" min={0} max={1} step={0.01} value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
