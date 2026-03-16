"use client";

import React from "react";
import { motion } from "framer-motion";

interface MiniWaveProps {
    active: boolean;
    className?: string;
    color?: string;
}

export const MiniWave = ({ active, className, color }: MiniWaveProps) => {
    const bars = [3, 5, 7, 5, 4, 6, 4, 3];
    const baseColor = color || (active ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)");

    return (
        <div className={`flex items-end gap-[1.5px] ${className}`} style={{ height: 12 }}>
            {bars.map((h, i) => (
                <motion.div
                    key={i}
                    style={{
                        width: 1.5,
                        borderRadius: 2,
                        background: baseColor,
                        boxShadow: active ? "0 0 12px rgba(255,255,255,0.2)" : "none"
                    }}
                    animate={active ? {
                        height: [h * 1.5, h * 2.8, h * 1.2, h * 2.5, h * 1.5]
                    } : {
                        height: h * 1.2
                    }}
                    transition={active ? {
                        duration: 1.1,
                        repeat: Infinity,
                        delay: i * 0.09,
                        ease: "easeInOut"
                    } : {
                        duration: 0.3
                    }}
                />
            ))}
        </div>
    );
};
