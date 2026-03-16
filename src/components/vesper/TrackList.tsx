import React, { useState } from "react";
import { motion } from "framer-motion";
import { Music2, ChevronRight } from "lucide-react";
import { AURA_DATA, T, Rise, Label, Sep } from "@/components/vesper/Shared";

export function TrackList({ tracks }: { tracks: { id: string | number; title: string; artist: string; dur: string; img: string; }[] }) {
    const [hover, setHover] = useState<number | string | null>(null);

    return (
        <section className="px-5 md:px-12 pb-24 max-w-[1100px] mx-auto">
            <Rise className="flex items-end justify-between mb-12">
                <div>
                    <Label><Music2 className="w-3 h-3" /> Archive</Label>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-4" style={{ color: T.text }}>Heavy Rotation</h2>
                </div>
                <span className="text-sm font-mono hidden md:block" style={{ color: T.sub }}>2026</span>
            </Rise>

            <div className="flex flex-col" onMouseLeave={() => setHover(null)}>
                {tracks.map((t, i) => {
                    const on = hover === t.id;
                    return (
                        <Rise key={`${t.id}-${i}`} delay={0.05 * i}>
                            <>
                                {i === 0 && <Sep />}
                                <motion.div
                                    onMouseEnter={() => setHover(t.id)}
                                    animate={{ backgroundColor: on ? T.glass : "transparent" }}
                                    transition={{ duration: 0.25 }}
                                    className="group relative flex items-center justify-between px-4 py-4 rounded-xl cursor-default"
                                >
                                    {/* Left cluster */}
                                    <div className="flex items-center gap-5 min-w-0">
                                        {/* Index */}
                                        <motion.span
                                            animate={{ color: on ? T.text : T.dim }}
                                            className="font-mono text-xs w-5 shrink-0 text-right hidden sm:block"
                                        >{String(i + 1).padStart(2, "0")}</motion.span>

                                        {/* Thumb */}
                                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0"
                                            style={{ boxShadow: `0 4px 12px -4px rgba(0,0,0,0.7), inset 0 0 0 1px ${T.border}` }}
                                        >
                                            <img src={t.img} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 transition-opacity duration-400"
                                                style={{ background: "rgba(0,0,0,0.35)", opacity: on ? 0 : 1 }}
                                            />
                                        </div>

                                        {/* Title / artist */}
                                        <div className="min-w-0">
                                            <motion.p
                                                animate={{ x: on ? 4 : 0 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                                className="font-semibold text-base md:text-lg truncate" style={{ color: T.text }}
                                            >{t.title}</motion.p>
                                            <motion.p
                                                animate={{ x: on ? 4 : 0 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.02 }}
                                                className="text-sm truncate" style={{ color: T.sub }}
                                            >{t.artist}</motion.p>
                                        </div>
                                    </div>

                                    {/* Right cluster */}
                                    <div className="flex items-center gap-4 pl-4 shrink-0">
                                        {/* EQ bars */}
                                        <motion.div
                                            animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.75 }}
                                            transition={{ duration: 0.25 }}
                                            className="hidden md:flex items-end gap-[3px] h-4"
                                        >
                                            {[1, 2, 3, 4, 5].map(b => (
                                                <motion.div key={b}
                                                    style={{ background: T.text, width: 3, borderRadius: 2 }}
                                                    animate={{ height: on ? ["35%", "100%", "35%"] : "35%" }}
                                                    transition={{ duration: 0.45 + b * 0.09, repeat: on ? Infinity : 0 }}
                                                />
                                            ))}
                                        </motion.div>
                                        <span className="font-mono text-xs hidden sm:block" style={{ color: T.sub }}>{t.dur}</span>
                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: T.text }} />
                                    </div>
                                </motion.div>
                                <Sep />
                            </>
                        </Rise>
                    );
                })}
            </div>
        </section>
    );
}
