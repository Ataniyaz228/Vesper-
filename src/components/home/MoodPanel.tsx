import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const MOODS = [
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

export function MoodPanel({ mood, onClick }: { mood: typeof MOODS[0]; onClick: () => void }) {
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
