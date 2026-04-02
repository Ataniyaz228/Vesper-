"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ListMusic, Loader2, Disc } from "lucide-react";
import { usePlaylistsStore } from "@/store/usePlaylistsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Track } from "@/lib/youtube";
import { cn } from "@/lib/utils";

interface AddToPlaylistPickerProps {
    track: Track;
    open: boolean;
    onClose: () => void;
    anchorRect?: DOMRect;
}

export function AddToPlaylistPicker({ track, open, onClose, anchorRect }: AddToPlaylistPickerProps) {
    const { user } = useAuthStore();
    const { playlists, fetchPlaylists, addTrack, createPlaylist, loading } = usePlaylistsStore();
    const [added, setAdded] = useState<Set<string>>(new Set());
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (open && user) fetchPlaylists();
    }, [open, user, fetchPlaylists]);

    const handleAdd = async (playlistId: string) => {
        setAdded(s => new Set(s).add(playlistId));
        await addTrack(playlistId, track);
    };

    const handleCreate = async () => {
        setCreating(true);
        const pl = await createPlaylist(`${track.title.slice(0, 22)}…`);
        if (pl) {
            await addTrack(pl.id, track);
            setAdded(s => new Set(s).add(pl.id));
        }
        setCreating(false);
    };

    const style: React.CSSProperties = anchorRect
        ? {
            position: "fixed",
            left: Math.min(anchorRect.left, window.innerWidth - 268),
            top: anchorRect.bottom + 8,
        }
        : {};

    // Render in portal to escape CSS transform contexts (like Framer Motion Reorder.Item)
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    {/* Transparent backdrop */}
                    <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); onClose(); }} />

                    {/* Dropdown */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -6 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="z-[201] w-64 rounded-2xl overflow-hidden border border-white/[0.07]"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            ...style,
                            background: "rgba(11,11,17,0.98)",
                            backdropFilter: "blur(40px)",
                            boxShadow: "0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)",
                            ...(anchorRect ? {} : { position: "relative" }),
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
                            <Disc className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
                                В плейлист
                            </span>
                        </div>

                        {/* New playlist */}
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/[0.05] transition-colors text-sm disabled:opacity-50 group"
                        >
                            <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
                                {creating
                                    ? <Loader2 className="w-3.5 h-3.5 text-white/40 animate-spin" />
                                    : <Plus className="w-3.5 h-3.5 text-white/40" />
                                }
                            </div>
                            <span className="text-white/50 group-hover:text-white/80 transition-colors">
                                Новый плейлист
                            </span>
                        </button>

                        {/* Existing playlists */}
                        <div className="max-h-56 overflow-y-auto border-t border-white/[0.05]">
                            {loading && playlists.length === 0 && (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
                                </div>
                            )}
                            {!loading && playlists.length === 0 && (
                                <p className="text-xs text-white/20 text-center py-5 px-3">
                                    Нет плейлистов
                                </p>
                            )}
                            {playlists.map(pl => {
                                const isAdded = added.has(pl.id);
                                return (
                                    <button
                                        key={pl.id}
                                        onClick={() => !isAdded && handleAdd(pl.id)}
                                        className={cn(
                                            "flex items-center gap-3 w-full px-4 py-2.5 transition-all text-sm group",
                                            isAdded
                                                ? "text-emerald-400 cursor-default"
                                                : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                            isAdded
                                                ? "bg-emerald-500/12 border border-emerald-500/20"
                                                : "bg-white/[0.05] border border-white/[0.07] group-hover:bg-white/[0.09]"
                                        )}>
                                            {isAdded
                                                ? <Check className="w-3.5 h-3.5" />
                                                : <ListMusic className="w-3.5 h-3.5 text-white/25" />
                                            }
                                        </div>
                                        <span className="flex-1 text-left truncate">{pl.title}</span>
                                        <span className="text-[10px] opacity-30 flex-shrink-0">{pl.trackCount}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
