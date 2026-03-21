"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import {
    ArrowLeft, Play, Pause, Shuffle, Trash2, Music2,
    Clock, MoreHorizontal, Heart, ListPlus
} from "lucide-react";
import Image from "next/image";
import { usePlaylistsStore } from "@/store/usePlaylistsStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { AddToPlaylistPicker } from "@/components/playlists/AddToPlaylistPicker";
import { Track } from "@/lib/youtube";
import { cn, cleanTitle } from "@/lib/utils";
import { MiniWave } from "@/components/ui/MiniWave";

// ── Animated bars (equalizer) ────────────────────────────────────────────
function EqBars() {
    return (
        <div className="flex items-end gap-[2px] h-4 w-5">
            {[0.6, 1, 0.8].map((d, i) => (
                <motion.div
                    key={i}
                    className="w-[3px] rounded-sm bg-purple-400"
                    animate={{ scaleY: [0.3, 1, 0.5, 0.85, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15, ease: "easeInOut" }}
                    style={{ originY: 1, height: 14 }}
                />
            ))}
        </div>
    );
}

// ── Format duration ms → m:ss ────────────────────────────────────────────
function fmt(ms?: number) {
    if (!ms) return "—";
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ── Track row ────────────────────────────────────────────────────────────
function TrackRow({
    track, index, playlistId, onPlay, isCurrent, isPlaying
}: {
    track: Track; index: number; playlistId: string;
    onPlay: (t: Track) => void; isCurrent: boolean; isPlaying: boolean;
}) {
    const { removeTrack } = usePlaylistsStore();
    const { toggleLikeTrack, isTrackLiked } = useLibraryStore();
    const liked = isTrackLiked(track.id);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerAnchor, setPickerAnchor] = useState<DOMRect | undefined>();

    return (
        <>
            <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.025, 0.4), duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onPlay(track)}
                className={cn(
                    "group relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all cursor-pointer",
                    "border border-transparent",
                    isCurrent
                        ? "bg-white/[0.07] border-white/[0.07]"
                        : "hover:bg-white/[0.04] hover:border-white/[0.04]"
                )}
            >
                {/* Glow on active */}
                {isCurrent && (
                    <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{ background: "radial-gradient(ellipse at left, rgba(139,92,246,0.08) 0%, transparent 70%)" }}
                    />
                )}

                {/* Index / waveform */}
                <div className="w-7 flex items-center justify-center flex-shrink-0 relative">
                    {isCurrent && isPlaying ? (
                        <EqBars />
                    ) : (
                        <>
                            <span className={cn(
                                "text-xs tabular-nums font-semibold transition-all",
                                isCurrent ? "text-purple-400" : "text-white/20 group-hover:hidden"
                            )}>
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <Play className="w-4 h-4 text-white/70 absolute opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:block" />
                        </>
                    )}
                </div>

                {/* Thumb */}
                <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/6 ring-1 ring-white/[0.06]">
                    {track.albumImageUrl && (
                        <Image
                            src={track.albumImageUrl}
                            alt=""
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            unoptimized
                        />
                    )}
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                    <p className={cn(
                        "text-sm font-semibold truncate transition-colors",
                        isCurrent ? "text-purple-300" : "text-white/85 group-hover:text-white"
                    )}>
                        {cleanTitle(track.title)}
                    </p>
                    <p className="text-xs text-white/35 truncate mt-0.5">{track.artist}</p>
                </div>

                {/* Duration */}
                <span className="text-xs text-white/25 tabular-nums hidden sm:block flex-shrink-0 font-mono">
                    {fmt(track.durationMs)}
                </span>

                {/* Action buttons — visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                        onClick={e => { e.stopPropagation(); toggleLikeTrack(track); }}
                        className="p-1.5 rounded-lg hover:bg-white/8 transition-all"
                    >
                        <Heart className={cn(
                            "w-3.5 h-3.5 transition-colors",
                            liked ? "fill-[#f43f5e] text-[#f43f5e]" : "text-white/30 hover:text-white/60"
                        )} />
                    </button>
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            setPickerAnchor(e.currentTarget.getBoundingClientRect());
                            setPickerOpen(p => !p);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/60 transition-all"
                    >
                        <ListPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); removeTrack(playlistId, track.id); }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/12 text-white/25 hover:text-rose-400 transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </motion.div>

            {pickerOpen && (
                <AddToPlaylistPicker
                    track={track}
                    open={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    anchorRect={pickerAnchor}
                />
            )}
        </>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function MyPlaylistPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const { playlists, fetchPlaylist } = usePlaylistsStore();
    const { playTrack, currentTrack, isPlaying, isLoading, togglePlay } = usePlayerStore();

    const playlist = playlists.find(p => p.id === id);
    const tracks = playlist?.tracks ?? [];

    const scrollRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ container: scrollRef });
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useSpring(useTransform(scrollYProgress, [0, 0.2], [1, 1.08]), { stiffness: 80, damping: 20 });
    const headerBg = useTransform(scrollYProgress, [0.12, 0.22], [0, 1]);

    useEffect(() => { fetchPlaylist(id); }, [id, fetchPlaylist]);

    const handlePlay = useCallback((track: Track, fromIndex?: number) => {
        const remaining = fromIndex !== undefined ? tracks.slice(fromIndex + 1) : [];
        usePlayerStore.setState(s => ({ userQueue: [...remaining, ...s.userQueue.filter(t => !remaining.find(r => r.id === t.id))] }));
        playTrack(track);
    }, [tracks, playTrack]);

    const handlePlayAll = useCallback(() => {
        if (tracks.length === 0) return;
        usePlayerStore.setState({ userQueue: tracks.slice(1) });
        playTrack(tracks[0]);
    }, [tracks, playTrack]);

    const handleShuffle = useCallback(() => {
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        if (!shuffled.length) return;
        usePlayerStore.setState({ userQueue: shuffled.slice(1) });
        playTrack(shuffled[0]);
    }, [tracks, playTrack]);

    const isCurrentPlaylistActive = tracks.some(t => t.id === currentTrack?.id);
    const totalDurationMs = tracks.reduce((s, t) => s + (t.durationMs ?? 0), 0);
    const totalMin = Math.round(totalDurationMs / 60000);

    // Derive cover from first track with art, or playlist coverUrl
    const coverUrl = playlist?.coverUrl ?? tracks.find(t => t.albumImageUrl)?.albumImageUrl;

    return (
        <div ref={scrollRef} className="relative h-full overflow-y-auto text-white">

            {/* ══════ STICKY MINI HEADER ══════ */}
            <motion.div
                className="sticky top-0 z-40 flex items-center gap-4 px-6 h-16 border-b border-white/[0.04] backdrop-blur-2xl"
                style={{
                    background: useTransform(headerBg, v =>
                        `rgba(8,8,12,${v * 0.92})`
                    ) as unknown as string
                }}
            >
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center hover:bg-white/12 transition-all flex-shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 text-white/70" />
                </button>
                <AnimatePresence>
                    {playlist && (
                        <motion.span
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-bold text-white truncate flex-1"
                        >
                            {playlist.title}
                        </motion.span>
                    )}
                </AnimatePresence>
                {isCurrentPlaylistActive && (
                    <button
                        onClick={togglePlay}
                        className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-all"
                    >
                        {isPlaying ? <Pause className="w-4 h-4 fill-black text-black" /> : <Play className="w-4 h-4 fill-black text-black ml-0.5" />}
                    </button>
                )}
            </motion.div>

            {/* ══════ CINEMATIC HERO ══════ */}
            <div className="relative overflow-hidden" style={{ height: "clamp(300px, 44vh, 460px)" }}>
                {/* Parallax blurred cover */}
                <motion.div
                    className="absolute inset-0"
                    style={{ scale: heroScale }}
                >
                    {coverUrl ? (
                        <Image
                            src={coverUrl}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-950 via-purple-900 to-black" />
                    )}
                </motion.div>

                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#080810]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#080810]/80 to-transparent" />

                {/* Film grain */}
                <div
                    className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
                />

                {/* Hero text */}
                <motion.div
                    style={{ opacity: heroOpacity }}
                    className="absolute bottom-0 left-0 right-0 px-8 pb-8 z-10 flex items-end gap-7"
                >
                    {/* Cover tile */}
                    <div className="relative w-36 h-36 rounded-2xl overflow-hidden flex-shrink-0 shadow-[0_20px_60px_rgba(0,0,0,0.7)] ring-1 ring-white/10 bg-white/6">
                        {coverUrl ? (
                            <Image src={coverUrl} alt="" fill className="object-cover" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Music2 className="w-12 h-12 text-white/15" />
                            </div>
                        )}
                    </div>

                    <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/35 block mb-2">Плейлист</span>
                        <h1 className="font-black tracking-tight leading-none text-white mb-3 line-clamp-2"
                            style={{ fontSize: "clamp(22px, 4vw, 52px)" }}>
                            {playlist?.title ?? "…"}
                        </h1>
                        <div className="flex items-center gap-3 text-white/30 text-xs font-medium">
                            <span>{tracks.length} треков</span>
                            {totalMin > 0 && (
                                <>
                                    <span className="text-white/15">·</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {totalMin} мин.
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ══════ ACTION BAR ══════ */}
            <div className="flex items-center gap-4 px-8 py-6">
                <motion.button
                    onClick={isCurrentPlaylistActive && isPlaying ? togglePlay : handlePlayAll}
                    disabled={tracks.length === 0}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2),0_4px_24px_rgba(0,0,0,0.5)] disabled:opacity-40 flex-shrink-0"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {isCurrentPlaylistActive && isPlaying ? (
                            <motion.div key="pause" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                                <Pause className="w-6 h-6 fill-black text-black" />
                            </motion.div>
                        ) : (
                            <motion.div key="play" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                                <Play className="w-6 h-6 fill-black text-black ml-0.5" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>

                <motion.button
                    onClick={handleShuffle}
                    disabled={tracks.length === 0}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="w-11 h-11 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all disabled:opacity-40"
                >
                    <Shuffle className="w-4 h-4 text-white/60" />
                </motion.button>
            </div>

            {/* ══════ COLUMN HEADERS ══════ */}
            {tracks.length > 0 && (
                <div className="flex items-center gap-4 px-8 pb-2 border-b border-white/[0.05] mb-1">
                    <span className="w-7 text-center text-[10px] text-white/20 font-semibold uppercase tracking-widest">#</span>
                    <span className="w-11 flex-shrink-0" />
                    <span className="flex-1 text-[10px] text-white/20 font-semibold uppercase tracking-widest">Название</span>
                    <Clock className="w-3 h-3 text-white/15 flex-shrink-0 hidden sm:block" />
                    <span className="w-24 flex-shrink-0 hidden sm:block" />
                </div>
            )}

            {/* ══════ TRACK LIST ══════ */}
            <div className="px-4 pb-48">
                {tracks.length === 0 && !playlist ? (
                    <div className="flex flex-col items-center py-20 gap-4 text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <Music2 className="w-8 h-8 text-white/12" />
                        </motion.div>
                        <p className="text-sm text-white/20">Загрузка…</p>
                    </div>
                ) : tracks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center py-28 gap-5 text-center"
                    >
                        <div
                            className="w-20 h-20 rounded-3xl flex items-center justify-center"
                            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.12)" }}
                        >
                            <Music2 className="w-9 h-9 text-purple-400/40" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-white/30 mb-1">Плейлист пуст</p>
                            <p className="text-sm text-white/18 max-w-xs leading-relaxed">
                                Добавляй треки через кнопку&nbsp;
                                <span className="text-white/30 font-semibold">⊕</span>&nbsp;рядом с любым треком
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex flex-col gap-0.5 mt-1">
                        {tracks.map((track, i) => (
                            <TrackRow
                                key={track.id}
                                track={track}
                                index={i}
                                playlistId={id}
                                onPlay={(t) => handlePlay(t, i)}
                                isCurrent={currentTrack?.id === track.id}
                                isPlaying={isPlaying && !isLoading}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
