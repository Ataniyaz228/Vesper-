"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "framer-motion";
import { Play, Plus, ArrowRight, Disc } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { AuraTrackImage } from "@/components/ui/AuraTrackImage";
import { Track } from "@/lib/youtube";

// ── TYPES & HELPERS ─────────────────────────────────────────────────────────
interface DiscoverTrack extends Track {
    color1: string;
    color2: string;
    bgGradient: string;
}

import { cleanTitle } from "@/lib/utils";
import { NOISE_URL as NOISE } from "@/lib/constants";

// ── COMPONENT: CLUSTER CARD ──────────────────────────────────────────────────
function ClusterCard({ title, desc, img, onClick }: { title: string, desc: string, img: string, onClick: (e: React.MouseEvent) => void }) {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ y: -12, scale: 1.05 }}
            className="relative w-[300px] h-[450px] flex-shrink-0 rounded-[40px] overflow-hidden group cursor-pointer border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] bg-[#0a0a0c]"
        >
            <div className="absolute inset-0 z-0">
                <img
                    src={img}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.35] group-hover:grayscale-0 group-hover:brightness-90 transition-all duration-[1.5s] scale-110 group-hover:scale-100 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-1000" />
                <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{ backgroundImage: NOISE }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-gradient-to-tr from-white/5 via-transparent to-transparent" />
            </div>

            <div className="absolute bottom-10 left-10 right-10 z-10">
                <div className="mb-4 overflow-hidden">
                    <motion.h4 initial={{ y: "100%" }} whileInView={{ y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="text-4xl font-black italic uppercase tracking-tighter mb-1 text-white leading-none">
                        {title}
                    </motion.h4>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-[1px] w-8 bg-white/20 group-hover:w-12 transition-all duration-700" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-white transition-colors">{desc}</p>
                </div>
            </div>

            <div className="absolute top-10 right-10 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-black/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all -translate-x-6 group-hover:translate-x-0 shadow-2xl">
                <ArrowRight className="w-5 h-5 text-white" />
            </div>

            <div className="absolute top-8 left-10">
                <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.6em] group-hover:text-white/40 transition-colors">
                    Nodes_07
                </div>
            </div>
        </motion.div>
    );
}

const GENRES = [
    {
        title: "Phonk",
        desc: "Neural_Aesthetic",
        img: "https://i.pinimg.com/736x/c7/45/91/c74591db49cba025f28078684f532d00.jpg",
        q: "phonk"
    },
    {
        title: "Lo-Fi",
        desc: "Ghost_City",
        img: "https://i.pinimg.com/originals/70/eb/85/70eb85d8352f580605b65ca2854f6cc1.jpg",
        q: "lofi"
    },
    {
        title: "Jazz",
        desc: "Smoke_Logic",
        img: "https://i.pinimg.com/originals/8c/4d/94/8c4d94d46ef70e76cc03e380c3ae8f6b.jpg",
        q: "jazz"
    },
    {
        title: "Techno",
        desc: "Bento_Pulse",
        img: "https://i.pinimg.com/736x/68/cd/a6/68cda6ec352dde4918d525afc4baccc3.jpg",
        q: "techno"
    },
    {
        title: "Ambient",
        desc: "Horizon_Aesthetic",
        img: "https://i.pinimg.com/736x/aa/15/67/aa15679bb077c9851f7559986162ef68.jpg",
        q: "ambient"
    },
    {
        title: "Vocal",
        desc: "Signal_Aesthetic",
        img: "https://i.pinimg.com/736x/0d/88/d6/0d88d616e3ae3424ceec54f3d22d6df0.jpg",
        q: "vocal"
    },
    {
        title: "Classical",
        desc: "Deep_Heritage",
        img: "https://i.pinimg.com/originals/49/eb/23/49eb23aaf2366a8024192e0106f54406.jpg",
        q: "classical"
    },
    {
        title: "Electronic",
        desc: "Liquid_Aesthetic",
        img: "https://i.pinimg.com/736x/bf/fa/f9/bffaf9ae8e3ad8e1518af24ee7026501.jpg",
        q: "electronic"
    },
];

function wrap(min: number, max: number, v: number) {
    const rangeSize = max - min;
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

// ── FREQUENCY NODES: TRULY SEAMLESS INFINITE LOOP ───────────────────────────
function FrequencyNodes({ onNavigate }: { onNavigate: (e: React.MouseEvent, q: string) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const items = [...GENRES, ...GENRES, ...GENRES];

    const rawX = useMotionValue(0);
    const smoothX = useSpring(rawX, { stiffness: 45, damping: 25, mass: 1 });
    const [setWidth, setSetWidth] = useState(0);

    useEffect(() => {
        const update = () => {
            if (contentRef.current) {
                const total = contentRef.current.scrollWidth;
                const sw = total / 3;
                setSetWidth(sw);
                rawX.set(-sw);
            }
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [rawX]);

    const renderX = useTransform(smoothX, (v) => {
        if (setWidth === 0) return v;
        return wrap(-setWidth * 2, -setWidth, v);
    });

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                rawX.set(rawX.get() - e.deltaY * 1.2);
            }
        };

        const el = containerRef.current;
        if (!el) return;
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [rawX]);

    return (
        <div className="relative pt-32 pb-64 border-t border-white/5 overflow-hidden">
            <div className="px-6 lg:px-[10vw] mb-20 text-center md:text-left">
                <motion.p initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="text-[11px] font-black tracking-[1em] text-white/10 uppercase mb-6">
                    Continuity Protocol
                </motion.p>
                <div className="overflow-hidden">
                    <motion.h3
                        initial={{ y: "100%" }}
                        whileInView={{ y: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-6xl lg:text-9xl font-black italic uppercase tracking-tighter leading-none"
                    >
                        Freq<span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.1)" }}>uenc</span>y
                    </motion.h3>
                </div>
            </div>

            <div ref={containerRef} className="overflow-hidden w-full px-8 cursor-grab active:cursor-grabbing">
                <motion.div
                    ref={contentRef}
                    drag="x"
                    onDrag={(e, info) => {
                        rawX.set(rawX.get() + info.delta.x);
                    }}
                    style={{ x: renderX }}
                    className="flex gap-14 w-max pb-10 px-[10vw]"
                >
                    {items.map((g, i) => (
                        <ClusterCard key={i} title={g.title} desc={g.desc} img={g.img} onClick={(e) => onNavigate(e, g.q)} />
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

// ── EXHIBITION MODULE ───────────────────────────────────────────────────────
function ExhibitionTrack({ track, index, allTracks }: { track: DiscoverTrack, index: number, allTracks: Track[] }) {
    const { playTrack, currentTrack, isPlaying } = usePlayerStore();
    const { toggleLikeTrack, isTrackLiked } = useLibraryStore();
    const isActive = currentTrack?.id === track.id && isPlaying;
    const isSaved = isTrackLiked(track.id);

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-12 md:gap-24 mb-64 items-center`}
        >
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 text-[30vw] font-black text-white/[0.015] select-none pointer-events-none uppercase italic leading-none z-0">
                {track.title.charAt(0)}
            </div>

            <div className="relative z-10 w-full md:w-1/2">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.8 }}
                    className="relative group aspect-square rounded-[40px] overflow-hidden bg-[#0a0a0c] border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
                >
                    <AuraTrackImage
                        trackId={track.id}
                        fallbackUrl={track.albumImageUrl}
                        className="w-full h-full object-cover saturate-[1.1] transition-transform duration-1000 group-hover:scale-110"
                        alt={track.title}
                    />
                    <div
                        onClick={() => playTrack(track, allTracks)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 cursor-pointer"
                    >
                        <div className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                            <Play className="w-8 h-8 fill-current ml-1" />
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="relative z-20 w-full md:w-1/2 flex flex-col gap-8 text-center md:text-left">
                <div className="space-y-4">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: 60 }} transition={{ duration: 1, delay: 0.5 }} className="h-1 bg-white/20 rounded-full mx-auto md:mx-0" />
                    <h2 className="text-5xl lg:text-7xl xl:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] text-white">
                        {cleanTitle(track.title).split(' ').map((word, i) => (
                            <span key={i} className={i % 2 !== 0 ? "text-transparent stroke-text" : ""}>{word} </span>
                        ))}
                    </h2>
                    <div className="flex items-baseline justify-center md:justify-start gap-4 mt-2">
                        <span className="text-xl lg:text-3xl font-serif text-white/40 italic">{track.artist}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start mt-4">
                    <button
                        onClick={() => playTrack(track, allTracks)}
                        className="flex items-center gap-4 px-10 py-5 bg-white text-black rounded-full font-black uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        {isActive ? "Resonating" : "Listen Vibration"}
                        <Disc className={`w-4 h-4 ${isActive ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        onClick={() => toggleLikeTrack(track)}
                        className={`p-5 rounded-full border transition-all ${isSaved ? "bg-white/10 border-white/20 text-white" : "border-white/5 text-white/40 hover:border-white/20 hover:text-white"}`}
                    >
                        <Plus className={`w-5 h-5 transition-transform duration-500 ${isSaved ? "rotate-45" : ""}`} />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .stroke-text {
                    -webkit-text-stroke: 1px rgba(255,255,255,0.2);
                }
            `}</style>
        </motion.div>
    );
}

// ── MAIN VIEW ───────────────────────────────────────────────────────────────
export function DiscoverClientView({ initialTracks }: { initialTracks: DiscoverTrack[] }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [portalPos, setPortalPos] = useState({ x: 0, y: 0 });

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    const titleRotateX = useTransform(smoothY, [-0.5, 0.5], ["10deg", "-10deg"]);
    const titleRotateY = useTransform(smoothX, [-0.5, 0.5], ["-10deg", "10deg"]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            mouseX.set(e.clientX / window.innerWidth - 0.5);
            mouseY.set(e.clientY / window.innerHeight - 0.5);
        };
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, [mouseX, mouseY]);

    const handleNavigate = (e: React.MouseEvent, query: string) => {
        setPortalPos({ x: e.clientX, y: e.clientY });
        setIsNavigating(true);
        setTimeout(() => router.push(`/?q=${query}`), 800);
    };

    if (!mounted) return null;

    return (
        <div className="relative w-full bg-[#060608] text-white selection:bg-white/10 overflow-x-hidden no-scrollbar">
            <AnimatePresence>
                {isNavigating && (
                    <motion.div
                        initial={{ clipPath: `circle(0% at ${portalPos.x}px ${portalPos.y}px)` }}
                        animate={{ clipPath: `circle(150% at ${portalPos.x}px ${portalPos.y}px)` }}
                        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                        className="fixed inset-0 z-[100] bg-black border border-white/5 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {!initialTracks || initialTracks.length === 0 ? (
                <div className="h-screen w-full flex items-center justify-center text-white/50 text-[10px] font-black uppercase tracking-widest bg-[#060608]">
                    Awaiting Transmission...
                </div>
            ) : (
                <>
                    <div className="fixed inset-0 pointer-events-none z-0">
                        <div className="absolute inset-0 opacity-[0.05] mix-blend-screen" style={{ backgroundImage: NOISE }} />
                    </div>

                    <section className="relative h-screen flex flex-col justify-center px-6 lg:px-12 perspective-[1500px]">
                        <div className="relative z-10 pointer-events-none">
                            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] font-black tracking-[0.8em] text-white/20 uppercase mb-8">
                                Acoustic Archive
                            </motion.p>
                            <motion.h1
                                style={{ rotateX: titleRotateX, rotateY: titleRotateY, transformStyle: "preserve-3d" }}
                                initial={{ opacity: 0, z: -200 }} animate={{ opacity: 1, z: 0 }} transition={{ delay: 0.2, duration: 1.5 }}
                                className="text-[clamp(48px,15vw,120px)] md:text-[clamp(80px,16vw,200px)] font-black leading-[0.75] italic uppercase tracking-tighter"
                            >
                                Exp<span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)" }}>lo</span>re
                            </motion.h1>
                        </div>
                        <div className="absolute bottom-20 right-12 text-right">
                            <p className="text-xs font-serif italic text-white/40 max-w-sm mb-6 leading-relaxed">
                                A curated dimension where sound meets architectural space.
                            </p>
                            <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block opacity-20">
                                <ArrowRight className="w-16 h-16 text-white rotate-90" />
                            </motion.div>
                        </div>
                    </section>

                    <section className="container mx-auto px-6 lg:px-12 relative z-10">
                        <div className="mb-40 flex items-center justify-between border-b border-white/5 pb-12">
                            <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white/40 italic">Latest Entries</h2>
                        </div>
                        {initialTracks.map((track, i) => (
                            <ExhibitionTrack key={track.id} track={track} index={i} allTracks={initialTracks} />
                        ))}
                    </section>

                    <FrequencyNodes onNavigate={handleNavigate} />
                </>
            )}
        </div>
    );
}
