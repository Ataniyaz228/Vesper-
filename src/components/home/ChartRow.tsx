import React from "react";
import { motion } from "framer-motion";
import { Track } from "@/lib/youtube";
import { AuraTrackImage } from "@/components/ui/AuraTrackImage";
import { Waveform } from "@/components/home/Shared";

// ── Charts row (editorial 01, 02 style) ────────────────────────────────────────
export function ChartRow({ track, index, active, onClick }: { track: Track; index: number; active: boolean; onClick: () => void }) {
    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.55, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ x: 4, transition: { duration: 0.3 } }}
            className="flex items-center gap-5 px-6 py-4 cursor-pointer group border-b border-white/[0.035] last:border-none hover:bg-white/[0.025] transition-colors"
        >
            {/* Big number */}
            <span
                className="text-[56px] font-black leading-none select-none pointer-events-none"
                style={{
                    color: "rgba(255,255,255,0.05)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.04em",
                }}
            >
                {String(index + 1).padStart(2, "0")}
            </span>
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/[0.06]">
                <AuraTrackImage
                    trackId={track.id}
                    fallbackUrl={track.albumImageUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white text-[12px] font-semibold truncate">{track.title}</span>
                <span className="text-white/30 text-xs truncate mt-0.5">{track.artist}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <Waveform active={active} />
            </div>
        </motion.div>
    );
}
