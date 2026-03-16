"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface AuraDNAVisualizerProps {
    data: { name: string; pct: number }[];
    className?: string;
}

export const AuraDNAVisualizer = ({ data, className }: AuraDNAVisualizerProps) => {
    // Helper to generate a consistent color based on string
    const getGenreColor = (name: string, alpha: number = 0.5) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        // High saturation (60-80%) and balanced lightness (50-60%) for vibrant but readable blooms
        return `hsla(${h}, 70%, 65%, ${alpha})`;
    };

    // Generate a unique SVG path / blob cluster based on data
    const blobs = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data.map((item, i) => {
            const seed = i * 137.5; // Golden angle-ish
            const radius = 40 + (item.pct * 0.8); // Slightly larger
            const x = 50 + Math.cos(seed) * 25;
            const y = 50 + Math.sin(seed) * 25;

            return {
                id: item.name,
                x: `${x}%`,
                y: `${y}%`,
                radius,
                color: getGenreColor(item.name, 0.4 + (item.pct / 100) * 0.4),
                delay: i * 0.2
            };
        });
    }, [data]);

    return (
        <div className={`relative aspect-square overflow-hidden rounded-full border border-white/5 bg-black/40 backdrop-blur-3xl ${className}`}>
            {/* Ambient base */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent" />

            <svg viewBox="0 0 100 100" className="w-full h-full filter blur-md">
                <defs>
                    <filter id="aura-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                    </filter>
                </defs>

                <g filter="url(#aura-glow)">
                    {blobs.map((blob, i) => (
                        <motion.circle
                            key={blob.id}
                            cx={blob.x}
                            cy={blob.y}
                            r={blob.radius / 2}
                            fill={blob.color}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.3, 0.6, 0.3],
                                x: [0, 5, -5, 0],
                                y: [0, -5, 5, 0]
                            }}
                            transition={{
                                duration: 8 + i * 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: blob.delay
                            }}
                        />
                    ))}
                </g>
            </svg>

            {/* Center focus */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1/2 h-1/2 rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-pulse" />
                </div>
            </div>

            {/* Scanning line for high-tech feel */}
            <motion.div
                className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-20"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
};
