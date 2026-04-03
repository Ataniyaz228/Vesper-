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
import { SonicWaveformCanvas } from "@/components/ui/SonicWaveform";
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

// 1. Ambient Mood (Optimized radial gradients & Sonic Waveform)
function AmbientBackground({ rgb, title, isPlaying }: { rgb: RGB, title: string, isPlaying: boolean }) {
    const centerGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
    const edgeGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#040405] pointer-events-none">
            {/* Background Base Radial Gradient for smooth lighting */}
            <motion.div
                className="absolute inset-0 mix-blend-screen opacity-50"
                style={{
                    background: `radial-gradient(circle at center, ${centerGlow} 0%, ${edgeGlow} 50%, transparent 80%)`,
                }}
            />

            {/* The beautiful generative sonic waveform */}
            <SonicWaveformCanvas rgb={rgb} isPlaying={isPlaying} />

            {/* Giant Track Title Watermark */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center mix-blend-overlay opacity-[0.04] pointer-events-none z-10">
                <motion.h1
                    className="text-[18vw] font-black uppercase tracking-[-0.05em] leading-none select-none whitespace-nowrap text-white text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                >
                    {title}
                </motion.h1>
            </div>

            <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay z-10"
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
                    <AmbientBackground rgb={dominantColorRGB} title={cleanTitle(currentTrack.title)} isPlaying={isPlaying} />

                    {/* 1. Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="relative z-30 flex items-center justify-between px-6 md:px-12 h-16 md:h-24 w-full shrink-0"
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
                    <div className="relative flex-1 min-h-0 w-full flex flex-col md:flex-row items-center justify-center overflow-visible">
                        {/* Left panel — Cover art */}
                        <motion.div
                            animate={{
                                width: showLyrics ? "100%" : "100%",
                                opacity: 1,
                            }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={cn(
                                "flex flex-col items-center justify-center shrink-0 origin-center relative will-change-[width] gap-2 md:gap-3 py-2 px-6 md:px-12",
                                showLyrics ? "h-auto md:h-full md:!w-[42%]" : "h-full"
                            )}
                        >
                            {/* Album Cover */}
                            <motion.div
                                layout
                                initial={false}
                                animate={{
                                    scale: 1.02,
                                    rotate: 0,
                                    y: -4
                                }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className={cn(
                                    "relative aspect-square shrink-0 rounded-[28px] md:rounded-[48px] overflow-hidden shadow-2xl transition-height duration-700",
                                    "ring-1 ring-white/10 bg-[#0a0a0b]",
                                    showLyrics 
                                        ? "h-[clamp(110px,22vh,240px)] md:h-[clamp(180px,45vh,520px)]" 
                                        : "h-[clamp(160px,36vh,440px)] md:h-[clamp(180px,45vh,520px)]"
                                )}
                                style={{
                                    boxShadow: showLyrics
                                        ? `0 20px 50px -10px rgba(0,0,0,0.5), 0 0 30px rgba(${dominantColorRGB.r},${dominantColorRGB.g},${dominantColorRGB.b}, 0.15)`
                                        : `0 40px 100px -20px rgba(0,0,0,0.7), 0 16px 50px -8px rgba(${dominantColorRGB.r},${dominantColorRGB.g},${dominantColorRGB.b}, 0.3)`,
                                    WebkitMaskImage: '-webkit-radial-gradient(white, black)'
                                }}
                            >
                                <AuraTrackImage
                                    trackId={currentTrack.id}
                                    fallbackUrl={currentTrack.albumImageUrl}
                                    className="w-full h-full object-cover select-none scale-[1.01]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-transparent pointer-events-none z-10" />
                                <div className="absolute inset-0 rounded-[28px] md:rounded-[48px] border border-white/[0.08] pointer-events-none z-20" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05)_0%,transparent_50%)] pointer-events-none z-10" />
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />
                            </motion.div>

                            {/* Track Identity */}
                            <motion.div
                                animate={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                className="flex flex-col items-center shrink-0 text-center px-4 max-w-lg w-full"
                            >
                                <h2 className="text-base sm:text-xl md:text-3xl font-black tracking-tight leading-tight text-white line-clamp-1 md:line-clamp-2">
                                    {cleanTitle(currentTrack.title)}
                                </h2>
                                <p className="text-[10px] md:text-xs text-white/35 tracking-[0.2em] uppercase font-semibold mt-1">
                                    {currentTrack.artist}
                                </p>
                            </motion.div>
                        </motion.div>

                        {/* Right panel — Lyrics (slides in from the right) */}
                        <AnimatePresence>
                            {showLyrics && (
                                <>
                                <motion.div
                                    key="lyrics-panel"
                                    initial={{ opacity: 0, x: 40, width: "0%" }}
                                    animate={{ opacity: 1, x: 0, width: "60%" }}
                                    exit={{ opacity: 0, x: 40, width: "0%" }}
                                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                                    className="hidden md:block h-full relative shrink-0"
                                >
                                    <SynchronizedLyrics
                                        title={cleanTitle(currentTrack.title)}
                                        artist={currentTrack.artist}
                                        className="w-full h-full"
                                    />
                                </motion.div>
                                {/* Mobile lyrics — full width below the cover */}
                                <motion.div
                                    key="lyrics-panel-mobile"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="md:hidden w-full flex-1 min-h-0 relative overflow-hidden"
                                >
                                    <SynchronizedLyrics
                                        title={cleanTitle(currentTrack.title)}
                                        artist={currentTrack.artist}
                                        className="w-full h-full"
                                    />
                                </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 3. Footer — compact on mobile, pill console on desktop */}
                    <div className="relative z-30 w-full flex flex-col items-center shrink-0 px-4 md:px-8 pb-3 md:pb-8 pt-1 md:pt-5 gap-1 md:gap-5">

                        {/* ── Mobile-only: stacked progress + controls ── */}
                        <div className="md:hidden w-full flex flex-col gap-3 max-w-md mx-auto">
                            {/* Progress */}
                            <div
                                className="flex flex-col gap-1.5 w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center font-mono text-[10px] tracking-widest text-white/25">
                                    <span>{formatTime(progress)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                                <div
                                    className="relative h-7 flex items-center cursor-pointer select-none"
                                    ref={barRef}
                                    onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
                                    onMouseDown={(e) => { e.stopPropagation(); setIsDrag(true); handleSeek(e); }}
                                    onMouseMove={(e) => { e.stopPropagation(); if (isDrag) handleSeek(e); }}
                                    onMouseUp={(e) => { e.stopPropagation(); setIsDrag(false); }}
                                    onTouchStart={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (!barRef.current || !duration) return;
                                        const r = barRef.current.getBoundingClientRect();
                                        const touch = e.touches[0];
                                        const val = Math.max(0, Math.min(1, (touch.clientX - r.left) / r.width));
                                        seekTo(val * duration);
                                    }}
                                    onTouchMove={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (!barRef.current || !duration) return;
                                        const r = barRef.current.getBoundingClientRect();
                                        const touch = e.touches[0];
                                        const val = Math.max(0, Math.min(1, (touch.clientX - r.left) / r.width));
                                        seekTo(val * duration);
                                    }}
                                    onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                    style={{ touchAction: "none" }}
                                >
                                    <div className="absolute inset-x-0 h-[3px] bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-white/60 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    <div
                                        className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.6)] -translate-x-1/2"
                                        style={{ left: `${pct}%` }}
                                    />
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-5 py-1">
                                <button onClick={prevTrack} className="text-white/30 hover:text-white transition-colors p-2">
                                    <SkipBack className="w-5 h-5 fill-current" />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                </button>
                                <button onClick={nextTrack} className="text-white/30 hover:text-white transition-colors p-2">
                                    <SkipForward className="w-5 h-5 fill-current" />
                                </button>
                                <button
                                    onClick={() => currentTrack && toggleLikeTrack(currentTrack)}
                                    className="hover:scale-110 active:scale-90 transition-transform group p-2"
                                >
                                    <Heart
                                        className={cn(
                                            "w-5 h-5 transition-all duration-300",
                                            liked ? "fill-[#f43f5e] text-[#f43f5e]" : "text-white/25"
                                        )}
                                    />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleQueue(); }}
                                    className={cn(
                                        "p-2 rounded-full transition-all",
                                        isQueueOpen ? "bg-white/12 text-white" : "text-white/25"
                                    )}
                                >
                                    <ListMusic className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* ── Desktop: pill console (unchanged) ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
                            className="hidden md:flex w-full max-w-4xl bg-white/[0.03] border border-white/[0.05] shadow-[0_32px_80px_rgba(0,0,0,0.4)] rounded-full px-10 py-3 flex-row items-center gap-10"
                            style={{
                                backdropFilter: isFullyVisible ? "blur(40px)" : "none",
                                willChange: "transform, opacity"
                            }}
                        >
                            <div className="flex items-center gap-8 order-1">
                                <button onClick={prevTrack} className="text-white/20 hover:text-white transition-colors">
                                    <SkipBack className="w-5 h-5 fill-current" />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
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

                            <div className="flex flex-col gap-2 flex-1 w-full order-2">
                                <div className="flex justify-between items-center px-1 font-mono text-xs tracking-widest opacity-20">
                                    <span>{formatTime(progress)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                                <div
                                    className="group relative h-4 flex items-center cursor-pointer select-none"
                                    ref={barRef}
                                    onMouseEnter={() => setHover(true)}
                                    onMouseLeave={() => { setHover(false); setIsDrag(false); }}
                                    onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
                                    onMouseDown={(e) => { e.stopPropagation(); setIsDrag(true); handleSeek(e); }}
                                    onMouseMove={(e) => { e.stopPropagation(); if (isDrag) handleSeek(e); }}
                                    onMouseUp={(e) => { e.stopPropagation(); setIsDrag(false); }}
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

                            <div className="flex items-center gap-3 w-32 shrink-0 order-3 bg-white/[0.04] px-3 py-2 rounded-full border border-white/[0.08]">
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
