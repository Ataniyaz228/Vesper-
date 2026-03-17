import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

// ── Reveal on scroll ──────────────────────────────────────────────────────────
export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-60px 0px" });
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}>
            {children}
        </motion.div>
    );
}

// ── Section header ────────────────────────────────────────────────────────────
export function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
        <div className="flex items-end px-8 gap-4 mb-7">
            <div><span className="block text-xs tracking-[0.44em] text-white/14 uppercase font-semibold">{eyebrow}</span>
                <h2 className="text-[16px] font-bold tracking-[-0.025em] text-white/85 mt-0.5">{title}</h2></div>
            <div className="flex-1 h-px bg-white/[0.05] mb-1" />
        </div>
    );
}

// ── Animated waveform ─────────────────────────────────────────────────────────
export function Waveform({ active }: { active: boolean }) {
    const bars = [3, 5, 8, 6, 4, 7, 5, 3];
    return (
        <div className="flex items-end gap-[2px] h-4">
            {bars.map((h, i) => (
                <motion.div key={i} className="w-[2px] rounded-full"
                    style={{ backgroundColor: active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.14)" }}
                    animate={active ? { height: [h * 2, h * 3.2, h * 1.4, h * 2.8, h * 2] } : { height: h * 2 }}
                    transition={active ? { duration: 1.0, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" } : {}} />
            ))}
        </div>
    );
}

// ── Infinite marquee ──────────────────────────────────────────────────────────
export function Marquee({ items }: { items: string[] }) {
    const doubled = [...items, ...items, ...items];
    return (
        <div className="overflow-hidden w-full relative py-4">
            <div className="absolute inset-y-0 left-0 w-20 z-10" style={{ background: "linear-gradient(to right, #0a0a0c, transparent)" }} />
            <div className="absolute inset-y-0 right-0 w-20 z-10" style={{ background: "linear-gradient(to left, #0a0a0c, transparent)" }} />
            <motion.div animate={{ x: "-33.33%" }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }} className="flex gap-10 w-max">
                {doubled.map((name, i) => (
                    <span key={i} className="text-white/10 text-xs uppercase tracking-[0.35em] font-semibold flex items-center gap-4">
                        {name} <span className="w-[3px] h-[3px] rounded-full bg-white/10 inline-block" />
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
