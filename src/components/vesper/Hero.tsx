import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Disc3, Star, ArrowDown } from "lucide-react";
import { AuraDNAVisualizer } from "@/components/ui/AuraDNAVisualizer";
import { AURA_DATA, T, Rise, Label } from "@/components/vesper/Shared";

export function Hero({ d, dna }: {
    d: typeof AURA_DATA.identity & { lastResonated?: { title: string, artist: string } | null },
    dna?: { name: string; pct: number }[]
}) {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 600], [0, 100]);
    const fade = useTransform(scrollY, [0, 400], [1, 0]);
    const dnaScale = useTransform(scrollY, [0, 600], [1, 1.2]);
    const dnaOpacity = useTransform(scrollY, [0, 400], [0.15, 0]);

    return (
        <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden"
            style={{ background: T.bg }}
        >
            {/* Subtle vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(255,255,255,0.015) 0%, transparent 70%)"
            }} />

            {/* Fine grain noise */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: T.noiseUrl }}
            />

            {/* Aura DNA background */}
            <motion.div
                style={{ y, scale: dnaScale, opacity: dnaOpacity }}
                className="absolute w-[800px] h-[800px] pointer-events-none z-0"
            >
                <AuraDNAVisualizer data={dna || AURA_DATA.genres} />
            </motion.div>

            {/* Slow-breathing ring */}
            <motion.div
                animate={{ scale: [1, 1.04, 1], opacity: [0.08, 0.14, 0.08] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
                style={{ border: `1px solid ${T.dim}`, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
            />
            <motion.div
                animate={{ scale: [1.06, 1, 1.06], opacity: [0.05, 0.09, 0.05] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[900px] h-[900px] rounded-full pointer-events-none"
                style={{ border: `1px solid ${T.dim}`, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
            />

            {/* Parallax text block */}
            <motion.div style={{ y, opacity: fade }} className="flex flex-col items-center text-center px-6 z-10 select-none">
                <Rise delay={0.1}>
                    <Label><Disc3 className="w-3 h-3" /> {d.tagline}</Label>
                </Rise>

                <Rise delay={0.22} className="mt-10">
                    <h1 className="font-black leading-[0.82] uppercase tracking-[-0.04em]"
                        style={{ fontSize: "clamp(3rem, 13vw, 11rem)", color: T.text }}>
                        Your<br />
                        <span style={{ color: T.sub }}>Vesper</span>
                    </h1>
                </Rise>

                <Rise delay={0.38} className="mt-8">
                    <p className="text-base max-w-sm leading-relaxed" style={{ color: T.sub }}>{d.description}</p>
                </Rise>

                <Rise delay={0.52} className="mt-10 flex flex-col items-center gap-4">
                    <div className="inline-flex items-center gap-2.5 text-xs font-semibold px-4 py-2 rounded-full"
                        style={{ background: T.glass, color: T.text, border: `1px solid ${T.border}` }}
                    >
                        <Star className="w-3.5 h-3.5" style={{ color: T.sub }} />
                        {d.badge}
                    </div>

                    {d.lastResonated && (
                        <p className="text-xs font-mono uppercase tracking-[0.25em] text-white/20">
                            Last Resonated: <span className="text-white/40">{d.lastResonated.title}</span>
                        </p>
                    )}
                </Rise>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                animate={{ y: [0, 9, 0], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="absolute bottom-10 flex flex-col items-center gap-2"
            >
                <span className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: T.sub }}>Scroll</span>
                <ArrowDown className="w-4 h-4" style={{ color: T.dim }} />
            </motion.div>
        </section>
    );
}
