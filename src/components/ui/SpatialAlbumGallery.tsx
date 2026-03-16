"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

const InteractiveAlbumCard = ({ track, activeIndex, index }: { track: { id: string, coverUrl: string, title: string, color1: string, color2: string }, activeIndex: number, index: number }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    // rotateY was unused according to linting error
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || index !== activeIndex) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Calculate Stack Position
    const offset = index - activeIndex;
    const isVisible = Math.abs(offset) <= 2;
    const isActive = offset === 0;

    // The stack logic
    const targetX = offset * 250; // Spread them horizontally
    const targetZ = -Math.abs(offset) * 300; // Push inactive ones deep into the screen
    const targetScale = 1;
    const targetRotateY = offset * -25; // Create a concave gallery effect facing the center
    let targetOpacity = isActive ? 1 : 0.4 - Math.abs(offset) * 0.2;

    if (!isVisible) {
        targetOpacity = 0;
    }

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                // Merge parallax input (when active) with structural stack rotation (when inactive)
                rotateX: isActive ? rotateX : 0,
                x: targetX,
                z: targetZ,
                zIndex: 50 - Math.abs(offset),
                transformStyle: "preserve-3d",
            }}
            animate={{
                scale: targetScale,
                opacity: targetOpacity,
                rotateY: isActive ? 0 : targetRotateY,
            }}
            transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1], // Smooth Apple-like ease
            }}
            className={cn(
                "absolute inset-0 m-auto aspect-square w-full max-w-[420px] h-fit rounded-[32px] will-change-transform flex items-center justify-center",
                isActive ? "pointer-events-auto cursor-grab active:cursor-grabbing" : "pointer-events-none"
            )}
        >
            {/* Ambient Shadow Layer (Optimized for performance) */}
            <motion.div
                className="absolute inset-0 pointer-events-none -z-10 rounded-[32px]"
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    boxShadow: `0 40px 100px -20px ${track.color1}A0, 0 0 120px ${track.color2}40`
                }}
            />
            {/* Base shadow for inactive states */}
            <div className="absolute inset-0 pointer-events-none -z-20 rounded-[32px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)]" />

            {/* The Physical Card */}
            <div
                className="w-full h-full aspect-square rounded-[32px] overflow-hidden relative border border-white/10"
                style={{ transformStyle: "preserve-3d" }}
            >
                <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover scale-[1.02]"
                    loading="eager"
                    decoding="async"
                />

                {/* Inner shadow for framing */}
                <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] pointer-events-none" />

                {/* Ambient dynamic tint from the track color */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none mix-blend-color"
                    style={{ backgroundColor: track.color1 }}
                />

                {/* Parallax glare effect */}
                <motion.div
                    className="absolute inset-0 pointer-events-none mix-blend-overlay will-change-transform"
                    style={{
                        background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 50%)`,
                        opacity: isActive ? 1 : 0,
                    }}
                />
            </div>
        </motion.div>
    );
};

export default function SpatialAlbumGallery({ tracks, activeIndex }: { tracks: Array<{ id: string, coverUrl: string, title: string, color1: string, color2: string }>, activeIndex: number }) {
    return (
        <div className="relative w-full h-full perspective-[1500px] flex items-center justify-center transform-style-3d overflow-visible">
            {tracks.map((track, i) => (
                <InteractiveAlbumCard
                    key={track.id}
                    track={track}
                    activeIndex={activeIndex}
                    index={i}
                />
            ))}
        </div>
    );
}
