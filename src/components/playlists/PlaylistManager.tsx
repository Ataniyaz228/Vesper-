"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Pencil, Trash2, Check, ListMusic, Music2 } from "lucide-react";
import { usePlaylistsStore, UserPlaylist } from "@/store/usePlaylistsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ── Editable playlist row ─────────────────────────────────────────────────────
function PlaylistRow({
    playlist,
    onDelete,
    onClick,
}: {
    playlist: UserPlaylist;
    onDelete: (id: string) => void;
    onClick: (id: string) => void;
}) {
    const { renamePlaylist } = usePlaylistsStore();
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(playlist.title);

    const commit = useCallback(async () => {
        setEditing(false);
        if (title.trim() && title !== playlist.title) {
            await renamePlaylist(playlist.id, title.trim());
        } else {
            setTitle(playlist.title);
        }
    }, [title, playlist.title, playlist.id, renamePlaylist]);

    return (
        <div className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
            {/* Cover */}
            <button
                onClick={() => onClick(playlist.id)}
                className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/6 flex items-center justify-center"
            >
                {playlist.coverUrl ? (
                    <Image src={playlist.coverUrl} alt="" fill className="object-cover" unoptimized />
                ) : (
                    <ListMusic className="w-4 h-4 text-white/25" />
                )}
            </button>

            {/* Label */}
            <div className="flex-1 min-w-0">
                {editing ? (
                    <input
                        className="bg-white/8 border border-white/12 rounded-lg px-2 py-1 text-sm text-white w-full outline-none focus:border-white/30 transition-colors"
                        value={title}
                        autoFocus
                        onChange={e => setTitle(e.target.value)}
                        onBlur={commit}
                        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setTitle(playlist.title); setEditing(false); } }}
                    />
                ) : (
                    <button
                        onClick={() => onClick(playlist.id)}
                        className="text-left w-full"
                    >
                        <p className="text-sm font-medium text-white/85 truncate">{playlist.title}</p>
                        <p className="text-xs text-white/30">{playlist.trackCount} треков</p>
                    </button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editing ? (
                    <button onClick={commit} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-emerald-400 transition-all">
                        <Check className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    onClick={() => onDelete(playlist.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-rose-400 transition-all"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ── Main PlaylistManager ──────────────────────────────────────────────────────
interface PlaylistManagerProps {
    open: boolean;
    onClose: () => void;
}

export function PlaylistManager({ open, onClose }: PlaylistManagerProps) {
    const { user } = useAuthStore();
    const { playlists, loading, fetchPlaylists, createPlaylist, deletePlaylist } = usePlaylistsStore();
    const router = useRouter();
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (open && user) fetchPlaylists();
    }, [open, user, fetchPlaylists]);

    const handleNew = useCallback(async () => {
        setCreating(true);
        await createPlaylist();
        setCreating(false);
    }, [createPlaylist]);

    const handleOpen = useCallback((id: string) => {
        onClose();
        router.push(`/my-playlist/${id}`);
    }, [onClose, router]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="plm-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        key="plm-modal"
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ type: "spring", damping: 30, stiffness: 340 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[51] w-[26rem] rounded-2xl border border-white/8 overflow-hidden flex flex-col"
                        style={{
                            background: "rgba(10,10,14,0.97)",
                            backdropFilter: "blur(40px)",
                            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
                            maxHeight: "min(70vh, 32rem)",
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 flex-shrink-0">
                            <span className="text-sm font-semibold text-white">Мои плейлисты</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleNew}
                                    disabled={creating}
                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/60 hover:text-white transition-all disabled:opacity-50"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Создать
                                </button>
                                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/70 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1 py-2 px-1">
                            {loading && playlists.length === 0 && (
                                <div className="flex items-center justify-center py-10 text-white/25 text-sm">
                                    Загрузка…
                                </div>
                            )}

                            {!loading && playlists.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                    <Music2 className="w-8 h-8 text-white/15" />
                                    <p className="text-sm text-white/30">Нет плейлистов</p>
                                    <button
                                        onClick={handleNew}
                                        className="text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-full px-4 py-1.5 transition-all"
                                    >
                                        Создать первый плейлист
                                    </button>
                                </div>
                            )}

                            {playlists.map((pl) => (
                                <PlaylistRow
                                    key={pl.id}
                                    playlist={pl}
                                    onDelete={deletePlaylist}
                                    onClick={handleOpen}
                                />
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
