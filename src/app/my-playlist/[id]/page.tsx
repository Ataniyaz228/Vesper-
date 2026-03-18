"use client";

import React, { useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Shuffle, Trash2, Music2 } from "lucide-react";
import Image from "next/image";
import { usePlaylistsStore } from "@/store/usePlaylistsStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Track } from "@/lib/youtube";
import { cn } from "@/lib/utils";

function TrackRow({
    track,
    index,
    playlistId,
    onPlay,
}: {
    track: Track;
    index: number;
    playlistId: string;
    onPlay: (t: Track) => void;
}) {
    const { removeTrack } = usePlaylistsStore();
    const { currentTrack, isPlaying } = usePlayerStore();
    const isCurrent = currentTrack?.id === track.id;

    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.25 }}
            className={cn(
                "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer",
                isCurrent ? "bg-white/6" : "hover:bg-white/4"
            )}
            onClick={() => onPlay(track)}
        >
            {/* Index / Play indicator */}
            <div className="w-7 text-center flex-shrink-0">
                {isCurrent && isPlaying ? (
                    <div className="flex gap-[2px] justify-center items-end h-4">
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                className="w-[3px] bg-purple-400 rounded-sm"
                                animate={{ height: ["4px", "14px", "4px"] }}
                                transition={{ repeat: Infinity, duration: 0.6 + i * 0.1, delay: i * 0.1 }}
                            />
                        ))}
                    </div>
                ) : (
                    <span className={cn("text-sm tabular-nums", isCurrent ? "text-purple-400" : "text-white/25 group-hover:hidden")}>
                        {index + 1}
                    </span>
                )}
                <Play className={cn("w-4 h-4 text-white/60 hidden", !isCurrent && "group-hover:block")} />
            </div>

            {/* Thumb */}
            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/6">
                {track.albumImageUrl && (
                    <Image src={track.albumImageUrl} alt="" fill className="object-cover" unoptimized />
                )}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isCurrent ? "text-purple-300" : "text-white/85")}>{track.title}</p>
                <p className="text-xs text-white/35 truncate">{track.artist}</p>
            </div>

            <span className="text-xs text-white/30 tabular-nums hidden sm:block">
                {track.durationMs ? `${Math.floor(track.durationMs / 60000)}:${String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2, "0")}` : "—"}
            </span>

            {/* Remove */}
            <button
                onClick={e => { e.stopPropagation(); removeTrack(playlistId, track.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/12 text-white/25 hover:text-rose-400 transition-all"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
}

export default function MyPlaylistPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const { playlists, fetchPlaylist } = usePlaylistsStore();
    const { playTrack } = usePlayerStore();

    const playlist = playlists.find(p => p.id === id);

    useEffect(() => {
        fetchPlaylist(id);
    }, [id, fetchPlaylist]);

    const handlePlay = useCallback((track: Track, fromIndex?: number) => {
        const tracks = playlist?.tracks ?? [];
        // Load remaining tracks into queue
        const remaining = fromIndex !== undefined ? tracks.slice(fromIndex + 1) : [];
        usePlayerStore.setState(s => ({ userQueue: [...remaining, ...s.userQueue.filter(t => !remaining.find(r => r.id === t.id))] }));
        playTrack(track);
    }, [playlist, playTrack]);

    const handlePlayAll = useCallback(() => {
        const tracks = playlist?.tracks ?? [];
        if (tracks.length === 0) return;
        handlePlay(tracks[0], 0);
    }, [playlist, handlePlay]);

    const handleShuffle = useCallback(() => {
        const tracks = [...(playlist?.tracks ?? [])];
        if (tracks.length === 0) return;
        for (let i = tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
        }
        usePlayerStore.setState({ userQueue: tracks.slice(1) });
        playTrack(tracks[0]);
    }, [playlist, playTrack]);

    const tracks = playlist?.tracks ?? [];

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Назад
            </button>

            {/* Hero header */}
            <div className="flex items-end gap-5 mb-8">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-white/6 border border-white/6 flex items-center justify-center">
                    {playlist?.coverUrl ? (
                        <Image src={playlist.coverUrl} alt="" fill className="object-cover" unoptimized />
                    ) : (
                        <Music2 className="w-10 h-10 text-white/15" />
                    )}
                </div>
                <div>
                    <p className="text-xs uppercase tracking-widest text-white/30 mb-1">Плейлист</p>
                    <h1 className="text-2xl font-bold text-white">{playlist?.title ?? "…"}</h1>
                    <p className="text-sm text-white/35 mt-1">{playlist?.trackCount ?? tracks.length} треков</p>

                    <div className="flex items-center gap-2 mt-4">
                        <button
                            onClick={handlePlayAll}
                            disabled={tracks.length === 0}
                            className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/90 text-black text-sm font-semibold hover:bg-white transition-all disabled:opacity-40"
                        >
                            <Play className="w-4 h-4 fill-current" /> Слушать
                        </button>
                        <button
                            onClick={handleShuffle}
                            disabled={tracks.length === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 hover:bg-white/12 text-white/70 hover:text-white text-sm transition-all border border-white/8 disabled:opacity-40"
                        >
                            <Shuffle className="w-4 h-4" /> Перемешать
                        </button>
                    </div>
                </div>
            </div>

            {/* Tracks */}
            {tracks.length === 0 && !playlist ? (
                <div className="text-center py-16 text-white/25 text-sm">Загрузка…</div>
            ) : tracks.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3">
                    <Music2 className="w-10 h-10 text-white/12" />
                    <p className="text-sm text-white/30">Плейлист пуст. Добавьте треки через меню ♪</p>
                </div>
            ) : (
                <div className="space-y-0.5">
                    {tracks.map((track, i) => (
                        <TrackRow
                            key={track.id}
                            track={track}
                            index={i}
                            playlistId={id}
                            onPlay={(t) => handlePlay(t, i)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
