import React, { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// ── Smooth drag carousel ──────────────────────────────────────────────────────
export function DragShelf({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const raw = useMotionValue(0);
    const x = useSpring(raw, { stiffness: 55, damping: 18, mass: 0.85 });

    const clamp = (v: number) => {
        if (!contentRef.current || !containerRef.current) return v;
        return Math.min(0, Math.max(-(contentRef.current.scrollWidth - containerRef.current.offsetWidth + 64), v));
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const h = (e: WheelEvent) => { e.preventDefault(); raw.set(clamp(raw.get() - e.deltaY * 0.5)); };
        el.addEventListener("wheel", h, { passive: false });
        return () => el.removeEventListener("wheel", h);
    }, [raw]);

    return (
        <div ref={containerRef} className="overflow-hidden w-full" style={{ paddingLeft: 32, paddingRight: 32, cursor: "grab" }}>
            <motion.div ref={contentRef} drag="x" dragConstraints={containerRef}
                style={{ x }} dragTransition={{ bounceStiffness: 55, bounceDamping: 20 }} dragElastic={0.05}
                whileTap={{ cursor: "grabbing" }} className="flex gap-6 w-max pb-2 pt-8">
                {children}
            </motion.div>
        </div>
    );
}
