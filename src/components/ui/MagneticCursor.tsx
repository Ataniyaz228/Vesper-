"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function MagneticCursor() {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    // 1. Dot (Core) - Instant tracking
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // 2. Ring (Aura) - Smooth spring tracking
    const springConfig = { stiffness: 300, damping: 28, mass: 0.5 };
    const ringX = useSpring(mouseX, springConfig);
    const ringY = useSpring(mouseY, springConfig);

    useEffect(() => {
        // Disable default cursor globally for true native feel
        const style = document.createElement("style");
        style.innerHTML = `* { cursor: none !important; }`;
        document.head.appendChild(style);

        // Turn off custom cursor entirely on touch devices
        if (window.matchMedia("(pointer: coarse), (hover: none)").matches) {
            style.remove();
            return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!isVisible) setIsVisible(true);
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isInteractive = !!target.closest(
                'a, button, [role="button"], input, select, textarea, [data-cursor-expand]'
            );
            const isCursorPointer = window.getComputedStyle(target).cursor === "pointer";
            setIsHovering(isInteractive || isCursorPointer);
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("mouseover", handleMouseOver, { passive: true });
        document.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("mouseenter", handleMouseEnter);

        return () => {
            style.remove();
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseover", handleMouseOver);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("mouseenter", handleMouseEnter);
        };
    }, [mouseX, mouseY, isVisible]);

    return (
        <div
            className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden mix-blend-difference"
            style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0.5s ease" }}
        >
            {/* The Ring (Aura): lags smoothly behind, fades out on hover */}
            <motion.div
                className="absolute top-0 left-0 rounded-full border border-white/50"
                style={{
                    x: ringX,
                    y: ringY,
                    translateX: "-50%",
                    translateY: "-50%",
                    width: 32,
                    height: 32,
                }}
                animate={{
                    scale: isHovering ? 0.5 : 1,
                    opacity: isHovering ? 0 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />

            {/* The Dot (Core): follows instantly, expands massively on hover to visually invert buttons */}
            <motion.div
                className="absolute top-0 left-0 bg-white rounded-full"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: "-50%",
                    translateY: "-50%",
                    width: 8,
                    height: 8,
                }}
                animate={{
                    scale: isHovering ? 4 : 1,
                    opacity: 1,
                }}
                transition={{ type: "spring", stiffness: 450, damping: 28 }}
            />
        </div>
    );
}
