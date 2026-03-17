"use client";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type CardVariant = "glass" | "bento" | "premium" | "editorial";

interface CardProps extends MotionProps {
    variant?: CardVariant;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    hover?: boolean; // enable lift-on-hover
}

const VARIANTS: Record<CardVariant, string> = {
    glass: "bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl",
    bento: "bg-white/[0.02] backdrop-blur-lg border border-white/[0.04] rounded-[28px]",
    premium: "bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
    editorial: "bg-transparent border-b border-white/[0.06] rounded-none",
};

export function Card({ variant = "glass", className, children, onClick, hover = true, ...motionProps }: CardProps) {
    return (
        <motion.div
            onClick={onClick}
            whileHover={hover && onClick ? { y: -2, scale: 1.005 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(VARIANTS[variant], onClick && "cursor-pointer", className)}
            {...motionProps}
        >
            {children}
        </motion.div>
    );
}
