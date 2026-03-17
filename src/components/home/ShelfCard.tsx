import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Play } from "lucide-react";
import { Playlist } from "@/lib/youtube";
import { cleanTitle } from "@/lib/utils";

// ── Shelf card ────────────────────────────────────────────────────────────────
export function ShelfCard({ item, index, onClick }: { item: Playlist; index: number; onClick: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const mx = useMotionValue(0); const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 130, damping: 24 });
    const sy = useSpring(my, { stiffness: 130, damping: 24 });
    const rX = useTransform(sy, [-0.5, 0.5], ["8deg", "-8deg"]);
    const rY = useTransform(sx, [-0.5, 0.5], ["-8deg", "8deg"]);
    const gX = useTransform(sx, [-0.5, 0.5], ["115%", "-15%"]);
    const gY = useTransform(sy, [-0.5, 0.5], ["115%", "-15%"]);
    const w = "clamp(148px, 16vw, 208px)";
    return (
        <motion.div ref={ref}
            onMouseMove={(e) => { if (!ref.current) return; const r = ref.current.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }}
            onMouseLeave={() => { mx.set(0); my.set(0); }}
            onClick={onClick}
            style={{ rotateX: rX, rotateY: rY, transformStyle: "preserve-3d", perspective: 900, flexShrink: 0 }}
            whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 280, damping: 24 } }}
            className="cursor-pointer group relative"
        >
            <div className="absolute -top-6 left-0 text-xs font-black text-white/10 tabular-nums select-none">{String(index + 1).padStart(2, "0")}</div>
            <div className="absolute -bottom-4 left-[14%] right-[14%] h-6 pointer-events-none opacity-0 group-hover:opacity-55 transition-opacity duration-500"
                style={{ background: "rgba(100,60,200,0.5)", filter: "blur(14px)", borderRadius: "50%" }} />
            <div className="relative bg-[#0e0e0e]"
                style={{
                    width: w, aspectRatio: "1", borderRadius: 16, overflow: "hidden",
                    boxShadow: "0 12px 40px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)", transform: "translateZ(20px)"
                }}>
                {item.imageUrl && <img src={item.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700" />}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 55%)" }} />
                <motion.div className="absolute inset-0 mix-blend-soft-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(circle at ${gX} ${gY}, rgba(255,255,255,0.42) 0%, transparent 58%)` }} />
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 z-10">
                    <p className="text-white text-xs font-semibold line-clamp-2 leading-[1.3]">{cleanTitle(item.title)}</p>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-50 group-hover:scale-100">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xl">
                        <Play className="w-3 h-3 fill-black ml-0.5" />
                    </div>
                </div>
            </div>
            <div className="mt-2.5 px-0.5" style={{ width: w }}>
                <p className="text-white/25 text-xs font-medium line-clamp-1">{cleanTitle(item.title)}</p>
            </div>
        </motion.div>
    );
}
