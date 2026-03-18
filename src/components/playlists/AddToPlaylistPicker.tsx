"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ListMusic } from "lucide-react";
import { usePlaylistsStore } from "@/store/usePlaylistsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Track } from "@/lib/youtube";
import { cn } from "@/lib/utils";

interface AddToPlaylistPickerProps {
    track: Track;
    open: boolean;
    onClose: () => void;
    /** Anchor the dropdown to this rect if provided */
    anchorRect?: DOMRect;
}

export function AddToPlaylistPicker({ track, open, onClose, anchorRect }: AddToPlaylistPickerProps) {
    const { user } = useAuthStore();
    const { playlists, fetchPlaylists, addTrack, createPlaylist } = usePlaylistsStore();
    const [added, setAdded] = useState<Set<string>>(new Set());
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (open && user && playlists.length === 0) fetchPlaylists();
    }, [open, user, playlists.length, fetchPlaylists]);

    const handleAdd = async (playlistId: string) => {
        setAdded((s) => new Set(s).add(playlistId));
        await addTrack(playlistId, track);
    };

    const handleCreate = async () => {
        setCreating(true);
        const pl = await createPlaylist(`Плейлист: ${track.title.slice(0, 24)}`);
        if (pl) {
            await addTrack(pl.id, track);
            setAdded((s) => new Set(s).add(pl.id));
        }
        setCreating(false);
    };

    // Try to intelligently position below anchor
    const style: React.CSSProperties = anchorRect
        ? {
            position: "fixed",
            left: Math.min(anchorRect.left, window.innerWidth - 260),
            top: anchorRect.bottom + 4,
        }
        : {};

    return (
        <AnimatePresence>
            {open && (
                <>
                    <div className="fixed inset-0 z-[80]" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="z-[81] w-56 rounded-xl border border-white/8 overflow-hidden"
                        style={{
                            ...style,
                            background: "rgba(12,12,18,0.97)",
                            backdropFilter: "blur(32px)",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                            ...(anchorRect ? {} : { position: "relative" }),
                        }}
                    >
                        {/* Header */}
                        <div className="px-3 py-2 border-b border-white/6 text-[11px] font-semibold uppercase tracking-widest text-white/30">
                            Добавить в плейлист
                        </div>

                        {/* New playlist */}
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-white/5 transition-colors text-sm text-white/60 hover:text-white disabled:opacity-50"
                        >
                            <Plus className="w-3.5 h-3.5 text-white/40" />
                            Новый плейлист
                        </button>

                        {/* Existing playlists */}
                        <div className="max-h-52 overflow-y-auto border-t border-white/6">
                            {playlists.length === 0 && (
                                <p className="text-xs text-white/25 text-center py-4">Нет плейлистов</p>
                            )}
                            {playlists.map((pl) => {
                                const isAdded = added.has(pl.id);
                                return (
                                    <button
                                        key={pl.id}
                                        onClick={() => !isAdded && handleAdd(pl.id)}
                                        className={cn(
                                            "flex items-center gap-2.5 w-full px-3 py-2.5 transition-colors text-sm",
                                            isAdded
                                                ? "text-emerald-400 bg-emerald-500/5"
                                                : "text-white/70 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <ListMusic className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                                        <span className="flex-1 text-left truncate">{pl.title}</span>
                                        {isAdded && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
