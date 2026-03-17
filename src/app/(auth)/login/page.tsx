"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { NOISE_URL } from "@/lib/constants";

// ── Depth Overlay & Cinematic Background ──────────────────────────────────────
function CinematicBackground() {
    return (
        <>
            <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden bg-[#050505]">
                {/* Giant ambient glow */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[1200px] max-h-[1200px] rounded-full"
                    style={{
                        background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(159, 18, 57, 0.03) 40%, transparent 70%)",
                        filter: "blur(120px)",
                    }}
                    animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Giant VESPER text */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <span className="text-[clamp(12rem,28vw,30rem)] font-black leading-none tracking-tighter text-white opacity-[0.02] select-none">
                        VESPER
                    </span>
                </div>
                {/* Noise overlay */}
                <div
                    className="absolute inset-0 mix-blend-overlay opacity-[0.04]"
                    style={{ backgroundImage: NOISE_URL }}
                />
            </div>

            {/* Foreground Drifting Crystals / Energy Shards (Depth of Field) */}
            <div className="fixed inset-0 pointer-events-none select-none z-20 overflow-hidden">
                <motion.div
                    className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full"
                    style={{
                        background: "radial-gradient(ellipse, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
                        filter: "blur(40px)",
                    }}
                    animate={{ x: [0, 40, 0], y: [0, -30, 0], rotate: [0, 15, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -top-40 -right-20 w-[30rem] h-[30rem] rounded-full"
                    style={{
                        background: "radial-gradient(ellipse, rgba(79, 70, 229, 0.12) 0%, transparent 60%)",
                        filter: "blur(60px)",
                    }}
                    animate={{ x: [0, -50, 0], y: [0, 40, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
        </>
    );
}

// ── Premium Glass Input Field ──────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    suffix?: React.ReactNode;
}

function GlassInput({ label, suffix, ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-2 w-full text-left">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">
                {label}
            </label>
            <div className="relative">
                <input
                    {...props}
                    className={`w-full bg-white/[0.03] text-white text-sm placeholder:text-white/20 px-4 py-3.5 rounded-2xl outline-none transition-all duration-300 border border-white/10 focus:border-white/30 focus:bg-white/[0.06] ${suffix ? 'pr-12' : ''}`}
                />
                {suffix && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors flex items-center justify-center">
                        {suffix}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── The Login Page ────────────────────────────────────────────────────────────
export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);
    const user = useAuthStore((s) => s.user);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) router.replace("/");
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);
        setSubmitting(true);
        const err = await login(email, password);
        if (err) { setError(err); setSubmitting(false); return; }
        router.replace("/");
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 20, mass: 1 } }
    };

    return (
        <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 pb-32 md:pb-40 selection:bg-white/20 selection:text-white font-sans overflow-hidden">
            <CinematicBackground />

            {/* Bento Grid Layout */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="relative z-10 w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min md:auto-rows-[140px]"
            >
                {/* 1. Large Visual Anchor (Left) */}
                <motion.div
                    variants={itemVariants}
                    className="hidden md:block md:col-span-3 md:row-span-3 rounded-[32px] overflow-hidden relative border border-white/10 group shadow-2xl"
                >
                    <img src="/pins/pin1.jpg" alt="" className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent opacity-60" />
                </motion.div>

                {/* 2. Main Login Form (Center-ish) */}
                <motion.div
                    variants={itemVariants}
                    className="md:col-span-6 md:row-span-4 bg-white/[0.02] backdrop-blur-[40px] p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl flex flex-col items-start justify-center relative overflow-hidden"
                >
                    {/* Inner glow effect */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative w-full">
                        {/* Header */}
                        <div className="mb-10 w-full">
                            <span className="block text-xs md:text-xs tracking-[0.35em] uppercase font-bold text-white/30 mb-3 ml-1">
                                Secure Access
                            </span>
                            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
                                Sign in
                            </h1>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
                            <GlassInput
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />

                            <div className="flex flex-col gap-1 w-full">
                                <GlassInput
                                    label="Password"
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    suffix={
                                        <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1} className="p-1">
                                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                                <div className="flex justify-end pr-1 pt-1">
                                    <button type="button" className="text-xs font-semibold text-white/20 hover:text-white/40 transition-colors uppercase tracking-wider">
                                        Forgot?
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="text-red-400/80 text-[12px] font-medium bg-red-400/5 border border-red-400/10 px-4 py-2 rounded-xl mb-2">{error}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                type="submit"
                                disabled={submitting}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-14 flex items-center justify-center bg-white text-black rounded-full font-bold text-[14px] uppercase tracking-widest hover:bg-white/90 disabled:opacity-70 transition-all shadow-[0_0_32px_rgba(255,255,255,0.1)]"
                            >
                                {submitting ? (
                                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="block w-5 h-5 border-2 border-black/20 border-t-black rounded-full" />
                                ) : "Sign in"}
                            </motion.button>
                        </form>

                        <div className="mt-10 pt-8 border-t border-white/5 w-full flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-white/30 font-medium">
                                No account?{" "}
                                <Link href="/register" className="text-white/60 hover:text-white transition-colors">
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Tall Visual Anchor (Right) */}
                <motion.div
                    variants={itemVariants}
                    className="hidden md:block md:col-span-3 md:row-span-4 rounded-[32px] overflow-hidden relative border border-white/10 group shadow-2xl"
                >
                    <img src="/pins/pin3.jpg" alt="" className="absolute inset-0 w-full h-full object-cover saturate-[1.2] opacity-40 group-hover:scale-110 group-hover:opacity-70 transition-all duration-1000" />
                    <div className="absolute inset-0 bg-[#050505]/20 backdrop-grayscale-[40%]" />
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="text-xs font-mono text-white/30 uppercase tracking-[0.3em]">Sonic Space</div>
                    </div>
                </motion.div>

                {/* 4. Small Square Anchor (Bottom Left) */}
                <motion.div
                    variants={itemVariants}
                    className="hidden md:block md:col-span-3 md:row-span-1 rounded-[32px] overflow-hidden relative border border-white/10 group shadow-2xl"
                >
                    <img src="/pins/pin4.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
                </motion.div>

                {/* 5. Minimal Label Anchor (Bottom Right-ish) */}

            </motion.div>
        </main>
    );
}
