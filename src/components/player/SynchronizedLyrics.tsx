"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { useLyrics } from "@/hooks/useLyrics";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Loader2, Music } from "lucide-react";
import { cn } from "@/lib/utils";

export function SynchronizedLyrics({ title, artist, className }: { title: string, artist: string, className?: string }) {
    const { lyrics, isLoading, error } = useLyrics(title, artist);
    const { progress, isPlaying } = usePlayerStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    // 1. High-resolution time tracking 
    // We extrapolate time between the 1s ticks from YouTube using requestAnimationFrame for butter-smooth lyrics
    const [smoothTime, setSmoothTime] = useState(progress);

    useEffect(() => {
        if (!isPlaying) {
            setSmoothTime(progress);
            return;
        }

        const startTime = performance.now();
        let frameId: number;

        const update = () => {
            const now = performance.now();
            const delta = (now - startTime) / 1000;
            // Extrapolate up to 1.5 seconds maximum (in case the real progress update lags)
            setSmoothTime(progress + Math.min(delta, 1.5));
            frameId = requestAnimationFrame(update);
        };

        frameId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frameId);
    }, [progress, isPlaying]);

    // 2. Find the current line based on smooth playback progress
    useEffect(() => {
        if (!lyrics || lyrics.length === 0) return;
        // offset by 0.3s so it highlights slightly before the word hits for a tighter feel
        const currentTime = smoothTime + 0.3;

        let newIndex = lyrics.findIndex(line => line.time > currentTime);
        if (newIndex === -1) newIndex = lyrics.length; // End of song
        newIndex = Math.max(0, newIndex - 1);

        if (newIndex !== activeIndex) {
            setActiveIndex(newIndex);
        }
    }, [smoothTime, lyrics, activeIndex]);

    // 3. Smooth scrolling physics for the entire lyric block with dynamic heights
    const ySpring = useSpring(0, { stiffness: 90, damping: 20 });

    useEffect(() => {
        if (!containerRef.current || lineRefs.current.length === 0) return;

        const activeEl = lineRefs.current[activeIndex];
        if (!activeEl) return;

        const containerHeight = containerRef.current.clientHeight;
        const offsetTop = activeEl.offsetTop;
        const offsetHeight = activeEl.offsetHeight;

        // Target Y to exactly center this specific element, regardless of how many lines it wraps to
        const targetY = (containerHeight / 2) - (offsetTop + (offsetHeight / 2));
        ySpring.set(targetY);
    }, [activeIndex, ySpring, lyrics]);

    if (isLoading) {
        return (
            <div className={cn("flex items-center justify-center h-full w-full opacity-50", className)}>
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (error || !lyrics || lyrics.length === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center h-full w-full opacity-30 gap-4", className)}>
                <Music className="w-12 h-12" />
                <p className="text-sm font-medium tracking-widest uppercase">No lyrics available</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full h-full overflow-hidden mask-linear-fade", className)}
            style={{
                // A CSS mask to fade out the top and bottom of the lyrics container
                maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
                WebkitMaskImage: "-webkit-linear-gradient(top, transparent 0%, black 20%, black 80%, transparent 100%)"
            }}
        >
            <motion.div
                className="absolute w-full flex flex-col items-center"
                style={{ y: ySpring }}
            >
                {lyrics.map((line, i) => {
                    const isActive = i === activeIndex;
                    const isPast = i < activeIndex;

                    return (
                        <motion.div
                            key={i}
                            ref={(el) => { lineRefs.current[i] = el; }}
                            className="relative w-full flex items-center px-8 md:px-12 py-4 gap-4"
                            initial={false}
                            animate={{
                                opacity: isActive ? 1 : isPast ? 0.12 : 0.25,
                                scale: isActive ? 1.02 : 1,
                                filter: isActive ? "blur(0px)" : isPast ? "blur(5px)" : "blur(2px)"
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 25
                            }}
                        >
                            {/* Active line accent bar */}
                            <motion.div
                                className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-[2px] rounded-full bg-white"
                                animate={{ height: isActive ? 28 : 0, opacity: isActive ? 1 : 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                            <p
                                className={cn(
                                    "text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight leading-[1.3] text-left origin-left transition-colors duration-500 pl-4",
                                    isActive ? "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] font-bold" : "text-white/50"
                                )}
                            >
                                {line.text}
                            </p>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
