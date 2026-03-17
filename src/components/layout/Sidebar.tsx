"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { Home, Compass, Library, Disc, Sparkles, LogIn, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";

const NAV_LINKS = [
    { name: "Home", href: "/", icon: Home },
    { name: "Discover", href: "/discover", icon: Compass },
    { name: "Library", href: "/library", icon: Library },
    { name: "Your Vesper", href: "/vesper", icon: Sparkles },
];

export const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const { user, logout, hydrate, loading } = useAuthStore();
    const { sync } = useLibraryStore();
    const { isPlaying } = usePlayerStore();

    // Hydrate auth state on mount
    useEffect(() => { hydrate(); }, [hydrate]);

    // Sync library when user is detected
    useEffect(() => {
        if (user) sync();
    }, [user, sync]);

    // Magnetic Spotlight Logic
    const sidebarRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const handleLogout = async () => {
        await logout();
        useLibraryStore.getState().clearLocal();
        router.push("/login");
    };

    // Derive initials from username
    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : null;

    return (
        <aside
            ref={sidebarRef}
            onMouseMove={handleMouseMove}
            className="group hidden md:flex flex-col w-[260px] h-[calc(100vh-32px)] my-4 ml-4 bg-white/[0.02] backdrop-blur-xl border-r border-white/5 rounded-3xl p-5 gap-8 shrink-0 relative z-20 overflow-hidden"
        >
            {/* Dynamic Spotlight */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-500 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            400px circle at ${mouseX}px ${mouseY}px,
                            rgba(255,255,255,0.03),
                            transparent 80%
                        )
                    `,
                }}
            />

            {/* Logo Section */}
            <div className="flex items-center gap-3 px-3 relative z-10 pt-2">
                <div className="flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: isPlaying ? 360 : 0 }}
                        transition={
                            isPlaying
                                ? { duration: 12, repeat: Infinity, ease: "linear" }
                                : { duration: 0.8, ease: "easeOut" }
                        }
                    >
                        <Disc className="w-6 h-6 text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                    </motion.div>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white/90">
                    Vesper
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-[2px] relative z-10 w-full mt-2" onMouseLeave={() => setHoveredIndex(null)}>
                {NAV_LINKS.map((link, index) => {
                    const isActive = pathname === link.href;
                    const isHovered = hoveredIndex === index;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            onMouseEnter={() => setHoveredIndex(index)}
                            className="relative flex items-center gap-4 px-4 py-3 min-h-[48px] rounded-2xl transition-colors duration-200"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-nav-line"
                                    className="absolute left-0 top-[25%] bottom-[25%] w-[3px] bg-white/90 rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}
                            {isHovered && (
                                <motion.div
                                    layoutId="nav-highlight"
                                    className="absolute inset-0 bg-white/5 rounded-2xl"
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}
                            <div className="relative z-10 flex items-center gap-4">
                                <Icon className={cn(
                                    "w-5 h-5 transition-colors duration-300",
                                    isActive ? "text-white" : "text-white/40"
                                )} />
                                <span className={cn(
                                    "text-sm font-medium transition-colors duration-300",
                                    isActive ? "text-white" : "text-white/40"
                                )}>
                                    {link.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="flex-1" />

            {/* ── Auth Widget ── */}
            <div className="relative z-10 mb-2">
                {!loading && (
                    user ? (
                        /* Logged-in state */
                        <div className="group flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer">
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {initials ?? "??"}
                            </div>
                            {/* Info */}
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-medium text-white/80 truncate">{user?.username}</span>
                                {/* Green presence dot only — no text */}
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span className="text-xs text-white/25">Active</span>
                                </div>
                            </div>
                            {/* Logout — visible only on group hover */}
                            <button
                                onClick={handleLogout}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/30 hover:text-white/70"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        /* Logged-out state */
                        <div className="p-4 bg-[#050505]/60 border border-white/5 rounded-[20px] flex flex-col gap-3">
                            <div className="flex items-center gap-2.5">
                                <User className="w-4 h-4 text-white/20" />
                                <span className="text-xs text-white/25 font-medium">Not signed in</span>
                            </div>
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white border border-white/8 hover:border-white/16 transition-all hover:bg-white/[0.04]"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                Sign in
                            </Link>
                        </div>
                    )
                )}
            </div>
        </aside>
    );
};
