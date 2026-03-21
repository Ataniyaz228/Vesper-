import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { Disc3 } from "lucide-react";
import { T, Rise, Label } from "@/components/vesper/Shared";

export function AuraCard({ identity, stats, genres }: { identity: { name: string }; stats: { id: string; label: string; value: number; unit?: string }[]; genres: { name: string }[] }) {
    const ref = useRef<HTMLDivElement>(null);
    // Stable hue computed once per mount — avoids hydration mismatch + jitter on every mouse move
    const glareHue = useRef(Math.floor(Math.random() * 360));
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 100, damping: 25 });
    const sy = useSpring(my, { stiffness: 100, damping: 25 });

    // Smooth axial tilt
    const rX = useTransform(sy, [-0.5, 0.5], ["12deg", "-12deg"]);
    const rY = useTransform(sx, [-0.5, 0.5], ["-12deg", "12deg"]);

    // Parallax displacements
    const tX = useTransform(sx, [-0.5, 0.5], ["-8px", "8px"]);
    const tY = useTransform(sy, [-0.5, 0.5], ["-8px", "8px"]);

    // Holographic glare - rainbow shift
    const glareX = useTransform(sx, [-0.5, 0.5], ["100%", "0%"]);
    const glareY = useTransform(sy, [-0.5, 0.5], ["100%", "0%"]);

    const getGenreColor = (name: string, alpha: number = 0.5) => {
        let hash = 0;
        if (name) {
            for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        return `hsla(${h}, 70%, 65%, ${alpha})`;
    };

    const topGenreColor = genres && genres.length > 0 ? getGenreColor(genres[0].name, 0.2) : "rgba(255,255,255,0.05)";

    return (
        <section className="px-5 md:px-12 pb-48 flex flex-col items-center relative overflow-hidden" style={{ background: T.bg }}>
            {/* Background Atmosphere */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square opacity-20 blur-[120px] pointer-events-none"
                style={{ background: `radial-gradient(circle, ${topGenreColor} 0%, transparent 70%)` }} />

            <Rise className="text-center mb-20 relative z-10">
                <Label>Physicality</Label>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mt-4 italic uppercase" style={{ color: T.text }}>
                    The 2026 Artifact
                </h2>
                <p className="text-xs font-mono tracking-[0.2em] mt-4 opacity-30 uppercase">
                    Model: Vesper-v1.0 // Auth: Approved
                </p>
            </Rise>

            <Rise delay={0.2}>
                <motion.div
                    ref={ref}
                    onMouseMove={e => {
                        if (!ref.current) return;
                        const r = ref.current.getBoundingClientRect();
                        mx.set((e.clientX - r.left) / r.width - 0.5);
                        my.set((e.clientY - r.top) / r.height - 0.5);
                    }}
                    onMouseLeave={() => { mx.set(0); my.set(0); }}
                    style={{ rotateX: rX, rotateY: rY, transformStyle: "preserve-3d", perspective: 1500 }}
                    className="relative cursor-none group"
                >
                    {/* Card Container */}
                    <div className="w-[310px] sm:w-[380px] aspect-[1/1.42] rounded-[32px] overflow-hidden relative border border-white/10"
                        style={{
                            background: "#0d0d0f",
                            boxShadow: "0 100px 150px -50px rgba(0,0,0,1)",
                            transform: "translateZ(0px)"
                        }}
                    >
                        {/* 1. Internal Light Leaks (Genre Driven) */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {genres?.slice(0, 2).map((g, i) => (
                                <motion.div key={g.name}
                                    animate={{
                                        x: [0, 40, -40, 0],
                                        y: [0, -30, 30, 0],
                                        scale: [1, 1.2, 0.9, 1],
                                        opacity: [0.15, 0.25, 0.15]
                                    }}
                                    transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
                                    className="absolute w-full h-full blur-[80px]"
                                    style={{
                                        background: getGenreColor(g.name, 0.6),
                                        left: i === 0 ? '-30%' : '30%',
                                        top: i === 0 ? '-20%' : '40%'
                                    }}
                                />
                            ))}
                        </div>

                        {/* 2. Technical Blueprint Grid */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{ backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

                        {/* 3. Noise & Screen Texture */}
                        <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
                            style={{ backgroundImage: T.noiseUrl }} />

                        {/* 4. Iridescent Holographic Glare */}
                        <motion.div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-color-dodge"
                            style={{ background: useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, hsla(${glareHue.current}, 100%, 70%, 0.3) 0%, transparent 60%)` }}
                        />

                        {/* ────── CONTENT ────── */}
                        <div className="relative h-full p-10 flex flex-col justify-between z-20">
                            {/* TOP BAR */}
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#3affaa] shadow-[0_0_10px_#3affaa] animate-pulse" />
                                        <span className="text-xs font-mono tracking-widest text-[#3affaa] uppercase">Live Channel</span>
                                    </div>
                                    <span className="block text-xs font-mono opacity-30 mt-1 uppercase tracking-tighter">Serial: VES-0026-{new Date().getFullYear()}</span>
                                </div>
                                <div className="p-2.5 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
                                    <Disc3 className="w-4 h-4 opacity-40 animate-spin-slow" />
                                </div>
                            </div>

                            {/* CENTER BLOCK */}
                            <motion.div style={{ x: tX, y: tY }} className="transition-transform duration-100 ease-out">
                                <div className="mb-4">
                                    <Label className="text-[8px] opacity-40 tracking-[0.3em]">Sonic Class</Label>
                                    <h3 className="text-5xl font-black italic tracking-[-0.05em] leading-[0.82] uppercase mt-2 mix-blend-difference"
                                        style={{ color: T.text, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15))' }}>
                                        {identity.name.split(" ").map((w: string, i: number) => (
                                            <span key={i} className="block">{w === "Architect" ? <span className="opacity-40">{w}</span> : w}</span>
                                        ))}
                                    </h3>
                                </div>
                                <div className="w-12 h-0.5 bg-white/10" />
                            </motion.div>

                            {/* STATS CONTROL PANEL */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                {stats.slice(0, 4).map((s: { id: string; label: string; value: number; unit?: string }) => (
                                    <div key={s.id} className="group/stat">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="w-1 h-1 rounded-full bg-white/20" />
                                            <p className="text-[8px] font-mono uppercase tracking-widest opacity-30">{s.label}</p>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-mono font-bold tracking-tighter tabular-nums" style={{ color: T.text }}>
                                                {s.value.toLocaleString()}
                                            </span>
                                            <span className="text-[8px] font-mono opacity-20 uppercase">{s.unit || "px"}</span>
                                        </div>
                                        <div className="w-full h-[1px] bg-white/[0.03] mt-2 group-hover/stat:bg-white/10 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BOTTOM DECOR */}
                        <div className="absolute bottom-4 left-10 right-10 flex justify-between items-center opacity-20 pointer-events-none">
                            <span className="text-[7px] font-mono uppercase tracking-[0.4em]">Proprietary Engine</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-0.5 h-0.5 rounded-full bg-white" />)}
                            </div>
                        </div>
                    </div>

                    {/* INTERACTIVE CUSTOM CURSOR (Inside Card Area) */}
                    <motion.div
                        className="absolute inset-0 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ x: mx, y: my }}
                    >
                        <div className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 border border-white/20 rounded-full" />
                        <div className="absolute w-[1px] h-4 -translate-x-1/2 -translate-y-1/2 bg-white/40 left-1/2" />
                        <div className="absolute h-[1px] w-4 -translate-x-1/2 -translate-y-1/2 bg-white/40 top-1/2" />
                    </motion.div>

                    {/* SHARE CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-max"
                        style={{ transform: "translateZ(80px)" }}
                    >
                        <button className="px-8 py-3 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-110 active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                            Export Artifact
                        </button>
                    </motion.div>
                </motion.div>
            </Rise>
        </section>
    );
}
