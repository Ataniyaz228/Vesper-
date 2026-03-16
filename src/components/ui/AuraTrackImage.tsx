"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMetadataStore } from "@/store/useMetadataStore";

interface AuraTrackImageProps {
    trackId: string;
    fallbackUrl?: string;
    className?: string;
    alt?: string;
}

export const AuraTrackImage = ({ trackId, fallbackUrl, className, alt = "" }: AuraTrackImageProps) => {
    const enhancedUrl = useMetadataStore((state) => state.enhancedCovers[trackId]);
    const displayUrl = enhancedUrl || fallbackUrl;

    // We want to animate the transition between YouTube and iTunes art
    // if both are available or if it upgrades in real-time.
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <AnimatePresence mode="popLayout">
                <motion.img
                    key={displayUrl || "placeholder"}
                    src={displayUrl || "/placeholder-track.png"}
                    alt={alt}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </AnimatePresence>

            {/* If no image at all, show a subtle gradient skeleton */}
            {!displayUrl && (
                <div className="absolute inset-0 bg-white/5 animate-pulse" />
            )}
        </div>
    );
};
