import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { NOISE_URL as NOISE } from "@/lib/constants";
import { cleanTitle } from "@/lib/utils";

// ── Dynamic editorial CTA — reacts to currently playing track ─────────────────
export function NowPlayingEditorial({ onDiscover }: { onDiscover: () => void }) {
    const { currentTrack, isPlaying } = usePlayerStore();
    const hasTrack = !!currentTrack && isPlaying;

    return (
        <div className="pt-16 px-8">
            <div className="relative overflow-hidden rounded-[28px] min-h-[220px]"
                style={{ border: "1px solid rgba(255,255,255,0.05)" }}>

                {/* ── Base dark gradient always visible ── */}
                <div className="absolute inset-0"
                    style={{ background: "linear-gradient(135deg, #0a0814 0%, #120920 50%, #0a0a0c 100%)" }} />

                {/* ── Blurred album art bleeds through when track is playing ── */}
                <AnimatePresence mode="wait">
                    {hasTrack && currentTrack?.albumImageUrl && (
                        <motion.img
                            key={currentTrack.id}
                            src={currentTrack.albumImageUrl}
                            alt="" aria-hidden
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 1.4 }}
                            className="absolute object-cover saturate-150"
                            style={{ inset: "-10%", width: "120%", height: "120%", filter: "blur(40px)", opacity: 0.35 }}
                        />
                    )}
                </AnimatePresence>

                {/* dark scrim so text stays readable */}
                <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%)" }} />

                {/* film grain */}
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: NOISE }} />

                {/* ── Content ── */}
                <div className="relative z-10 flex flex-col gap-5 px-10 py-11">

                    {/* eyebrow changes */}
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-white/8 max-w-[48px]" />
                        <AnimatePresence mode="wait">
                            {hasTrack ? (
                                <motion.span key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-[8px] tracking-[0.5em] text-white/35 uppercase font-semibold flex items-center gap-2">
                                    <motion.span className="w-1.5 h-1.5 rounded-full bg-white/50 inline-block"
                                        animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                                    Now playing
                                </motion.span>
                            ) : (
                                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-[8px] tracking-[0.5em] text-white/20 uppercase font-semibold">
                                    Discover
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* headline */}
                    <AnimatePresence mode="wait">
                        {hasTrack ? (
                            <motion.div key={currentTrack?.id}
                                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="flex flex-col gap-1.5">
                                <h3 className="font-black text-white tracking-[-0.04em] leading-[1.02]"
                                    style={{ fontSize: "clamp(20px, 3.2vw, 48px)" }}>
                                    {cleanTitle(currentTrack?.title ?? "")}
                                </h3>
                                <p className="text-white/30 text-[12px] font-medium">{currentTrack?.artist}</p>
                            </motion.div>
                        ) : (
                            <motion.h3 key="default"
                                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                className="font-black text-white tracking-[-0.045em] leading-[1.02]"
                                style={{ fontSize: "clamp(28px, 4.5vw, 60px)" }}>
                                Your next<br />
                                <span style={{ color: "rgba(255,255,255,0.18)" }}>obsession</span><br />
                                awaits.
                            </motion.h3>
                        )}
                    </AnimatePresence>

                    {/* CTA */}
                    <motion.button onClick={onDiscover}
                        whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white/35 hover:text-white/70 transition-colors w-fit group mt-1">
                        Open Discover
                        <div className="w-6 h-6 rounded-full border border-white/12 flex items-center justify-center group-hover:border-white/40 transition-colors">
                            <ArrowRight className="w-3 h-3" />
                        </div>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
