"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    motion, AnimatePresence,
    Reorder, useDragControls,
} from "framer-motion";
import {
    ArrowLeft, Play, Pause, Shuffle, Trash2, Music2,
    Clock, Heart, ListPlus, GripVertical, PenLine, Check, X,
} from "lucide-react";
import Image from "next/image";
import { usePlaylistsStore } from "@/store/usePlaylistsStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { AddToPlaylistPicker } from "@/components/playlists/AddToPlaylistPicker";
import { PlaylistOptionsMenu } from "@/components/playlists/PlaylistOptionsMenu";
import { Track } from "@/lib/youtube";
import { cn, cleanTitle } from "@/lib/utils";
import { NOISE_URL as NOISE } from "@/lib/constants";
import { FastAverageColor } from "fast-average-color";

const EASE = [0.16, 1, 0.3, 1] as const;

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function fmt(ms?: number) {
    if (!ms) return "—";
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function EqBars() {
    return (
        <div className="flex items-end gap-[2px] h-4 w-5">
            {[4, 7, 5, 9, 4].map((h, i) => (
                <motion.div
                    key={i}
                    className="w-[2px] rounded-full bg-white/60"
                    animate={{ height: [h, h * 2.2, h * 0.8, h * 1.6, h] }}
                    transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
                />
            ))}
        </div>
    );
}

type RGB = { r: number; g: number; b: number };
function useDominantColor(url?: string | null): RGB {
    const [color, setColor] = useState<RGB>({ r: 30, g: 20, b: 50 });
    useEffect(() => {
        if (!url) return;
        const fac = new FastAverageColor();
        const t = setTimeout(() => {
            fac.getColorAsync(url, { algorithm: "dominant" })
                .then(res => {
                    const [r, g, b] = res.value;
                    const br = (r * 299 + g * 587 + b * 114) / 1000;
                    if (br < 30) setColor({ r: Math.min(255, r + 50), g: Math.min(255, g + 50), b: Math.min(255, b + 50) });
                    else setColor({ r, g, b });
                })
                .catch(() => {});
        }, 300);
        return () => clearTimeout(t);
    }, [url]);
    return color;
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.07] backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <span className="text-white/30">{icon}</span>
            <span className="text-xs font-semibold text-white/45 tracking-wide whitespace-nowrap">{label}</span>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Editorial Track Row
// ────────────────────────────────────────────────────────────────────────────
function TrackRow({
    track, index, playlistId, onPlay, isCurrent, isPlaying,
}: {
    track: Track; index: number; playlistId: string;
    onPlay: (t: Track) => void; isCurrent: boolean; isPlaying: boolean;
}) {
    const { removeTrack } = usePlaylistsStore();
    const { toggleLikeTrack, isTrackLiked } = useLibraryStore();
    const liked = isTrackLiked(track.id);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerAnchor, setPickerAnchor] = useState<DOMRect | undefined>();
    const dragControls = useDragControls();

    return (
        <>
            <Reorder.Item
                value={track}
                dragListener={false}
                dragControls={dragControls}
                as="div"
                className={cn(
                    "group relative flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 rounded-2xl transition-colors duration-200 cursor-pointer select-none",
                    "border border-transparent",
                    isCurrent
                        ? "bg-white/[0.06] border-white/[0.06]"
                        : "hover:bg-white/[0.035] hover:border-white/[0.04]"
                )}
                onClick={() => onPlay(track)}
                whileDrag={{
                    scale: 1.02,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                    zIndex: 50,
                    backgroundColor: "rgba(255,255,255,0.07)",
                }}
            >
                {/* Ambient glow for active track */}
                {isCurrent && (
                    <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        layoutId="active-track-glow"
                        style={{
                            background: "radial-gradient(ellipse at left, rgba(255,255,255,0.06) 0%, transparent 70%)",
                        }}
                    />
                )}

                {/* Drag handle */}
                <div
                    className="hidden sm:flex items-center justify-center w-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={(e) => { e.stopPropagation(); dragControls.start(e); }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-3.5 h-3.5 text-white/20" />
                </div>

                {/* Index / EqBars */}
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                    {isCurrent && isPlaying ? (
                        <EqBars />
                    ) : (
                        <>
                            <span className={cn(
                                "text-[11px] tabular-nums font-semibold transition-all group-hover:hidden",
                                isCurrent ? "text-white/70" : "text-white/18"
                            )}>
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <Play className="w-3.5 h-3.5 text-white/60 hidden group-hover:block" />
                        </>
                    )}
                </div>

                {/* Thumbnail */}
                <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/[0.06] bg-white/[0.04]">
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
                        "text-[13px] font-semibold truncate transition-colors cursor-pointer",
                        isCurrent ? "text-white" : "text-white/75 group-hover:text-white"
                    )}>
                        {cleanTitle(track.title)}
                    </p>
                    <p className="text-[11px] text-white/28 truncate mt-0.5">{track.artist}</p>
                </div>

                {/* Duration */}
                <span className="text-[11px] text-white/20 tabular-nums hidden sm:block flex-shrink-0 font-mono">
                    {fmt(track.durationMs)}
                </span>

                {/* Actions — hover only */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                        onClick={e => { e.stopPropagation(); toggleLikeTrack(track); }}
                        className="p-2 rounded-xl hover:bg-white/[0.06] transition-all"
                    >
                        <Heart className={cn(
                            "w-3.5 h-3.5 transition-colors",
                            liked ? "fill-[#f43f5e] text-[#f43f5e]" : "text-white/25 hover:text-white/55"
                        )} />
                    </button>
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            setPickerAnchor(e.currentTarget.getBoundingClientRect());
                            setPickerOpen(p => !p);
                        }}
                        className="p-2 rounded-xl hover:bg-white/[0.06] text-white/25 hover:text-white/55 transition-all"
                    >
                        <ListPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); removeTrack(playlistId, track.id); }}
                        className="p-2 rounded-xl hover:bg-rose-500/10 text-white/20 hover:text-rose-400/80 transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </Reorder.Item>

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

// ────────────────────────────────────────────────────────────────────────────
// Inline Rename Input
// ────────────────────────────────────────────────────────────────────────────
function RenameInput({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
    const [val, setVal] = useState(value);
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
    return (
        <form onSubmit={e => { e.preventDefault(); onSave(val.trim() || value); }} className="flex items-center gap-2">
            <input
                ref={ref}
                value={val}
                onChange={e => setVal(e.target.value)}
                className="bg-transparent text-white font-black tracking-tight focus:outline-none border-b border-white/20 focus:border-white/50 transition-colors min-w-0"
                style={{ fontSize: "clamp(22px, 4vw, 52px)" }}
                onKeyDown={e => e.key === "Escape" && onCancel()}
            />
            <button type="submit" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white/70" />
            </button>
            <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0">
                <X className="w-3.5 h-3.5 text-white/40" />
            </button>
        </form>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────
export default function MyPlaylistPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const { playlists, fetchPlaylist, renamePlaylist, deletePlaylist } = usePlaylistsStore();
    const { playTrack, currentTrack, isPlaying, isLoading, togglePlay } = usePlayerStore();

    const playlist = playlists.find(p => p.id === id);
    const [tracks, setTracks] = useState<Track[]>([]);

    useEffect(() => { setTracks(playlist?.tracks ?? []); }, [playlist?.tracks]);
    useEffect(() => { fetchPlaylist(id); }, [id, fetchPlaylist]);

    const [isRenaming, setIsRenaming] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Standard scroll listener instead of Framer Motion useScroll
    // to strictly toggle the sticky header background visually state.
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrolled(e.currentTarget.scrollTop > 100);
    };

    const handlePlay = useCallback((track: Track, fromIndex?: number) => {
        const remaining = fromIndex !== undefined ? tracks.slice(fromIndex + 1) : [];
        usePlayerStore.setState(s => ({
            userQueue: [...remaining, ...s.userQueue.filter(t => !remaining.find(r => r.id === t.id))]
        }));
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

    const handleDeletePlaylist = useCallback(async () => {
        await deletePlaylist(id);
        router.push("/library");
    }, [id, deletePlaylist, router]);

    const isCurrentPlaylistActive = tracks.some(t => t.id === currentTrack?.id);
    const totalDurationMs = tracks.reduce((s, t) => s + (t.durationMs ?? 0), 0);
    const totalMin = Math.round(totalDurationMs / 60000);

    const coverUrl = playlist?.coverUrl ?? tracks.find(t => t.albumImageUrl)?.albumImageUrl;
    const rgb = useDominantColor(coverUrl);
    const accentColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}`;

    // Clean DOM tree wrapper
    return (
        <div className="relative h-full text-white bg-[#080809] overflow-hidden flex flex-col">
            
            {/* ── Fixed Background Layers (Behind scrolling content) ── */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {coverUrl ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 0.25 }} transition={{ duration: 1 }}
                        className="absolute inset-[0] right-0 sm:right-[-20vw] top-[-10vh] border-none"
                    >
                        <Image
                            src={coverUrl}
                            alt=""
                            fill
                            className="object-cover blur-[100px] scale-150 saturate-[1.5]"
                            unoptimized
                        />
                    </motion.div>
                ) : (
                    <div className="absolute inset-0" style={{
                        background: `radial-gradient(circle at 60% 30%, ${accentColor}, 0.25) 0%, transparent 60%)`,
                    }} />
                )}
                {/* Heavy black fade to ground the content */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080809]/80 to-[#080809] backdrop-blur-[24px] sm:backdrop-blur-[40px] opacity-90" />
                {/* Noise */}
                <div className="absolute inset-0 opacity-[0.02] mix-blend-screen" style={{ backgroundImage: NOISE }} />
            </div>

            {/* ── Scrolling Viewport ── */}
            <div 
                onScroll={handleScroll} 
                className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar"
            >
                {/* Sticky Header */}
                <div 
                    className={cn(
                        "sticky top-0 z-40 flex items-center gap-4 px-5 h-16 transition-all duration-300",
                        scrolled ? "bg-[#080809]/90 border-b border-white/[0.04] backdrop-blur-3xl" : "bg-transparent border-transparent"
                    )}
                >
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.1] transition-all flex-shrink-0 border border-white/[0.06]"
                    >
                        <ArrowLeft className="w-4 h-4 text-white/60" />
                    </button>
                    <AnimatePresence>
                        {scrolled && playlist && (
                            <motion.span
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="text-sm font-bold text-white truncate flex-1"
                            >
                                {playlist.title}
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <div className="flex-1" />
                </div>

                {/* Main Content constraints */}
                <div className="max-w-6xl mx-auto pb-48">
                    
                    {/* Hero Section (Just flex, no absolute inset weirdness) */}
                    <div className="w-full px-6 sm:px-10 pt-8 pb-10 flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-10 min-h-[30vh]">
                        {/* Cover Tile */}
                        <div className="relative flex-shrink-0 z-10 w-[140px] sm:w-[220px] aspect-square rounded-[24px] overflow-hidden ring-1 ring-white/[0.1] shadow-2xl bg-white/[0.02]">
                            {coverUrl ? (
                                <Image src={coverUrl} alt="" fill className="object-cover" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Music2 className="w-12 h-12 text-white/10" />
                                </div>
                            )}
                        </div>

                        {/* Title Block */}
                        <div className="flex flex-col gap-3 min-w-0 pb-1 z-10">
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 drop-shadow-md">
                                Playlist
                            </span>

                            {isRenaming ? (
                                <RenameInput
                                    value={playlist?.title ?? ""}
                                    onSave={v => { renamePlaylist(id, v); setIsRenaming(false); }}
                                    onCancel={() => setIsRenaming(false)}
                                />
                            ) : (
                                <button
                                    onClick={() => setIsRenaming(true)}
                                    className="group text-left flex items-center gap-3 drop-shadow-2xl"
                                >
                                    <h1 className="font-bold tracking-tight text-white leading-none whitespace-normal group-hover:text-white/80 transition-colors"
                                        style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
                                        {playlist?.title ?? "Загрузка..."}
                                    </h1>
                                    <PenLine className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
                                </button>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <StatPill icon={<Music2 className="w-3.5 h-3.5" />} label={`${tracks.length} треков`} />
                                {totalMin > 0 && <StatPill icon={<Clock className="w-3.5 h-3.5" />} label={`${totalMin} мин`} />}
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-4 px-6 sm:px-10 py-4 mb-2 z-10 relative">
                        <motion.button
                            onClick={isCurrentPlaylistActive && isPlaying ? togglePlay : handlePlayAll}
                            disabled={tracks.length === 0}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.94 }}
                            className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold disabled:opacity-40 transition-all shadow-xl"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {isCurrentPlaylistActive && isPlaying ? (
                                    <motion.span key="p" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                                        <Pause className="w-4 h-4 fill-current" /> Пауза
                                    </motion.span>
                                ) : (
                                    <motion.span key="pl" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                                        <Play className="w-4 h-4 fill-current ml-0.5" /> Слушать
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        <motion.button
                            onClick={handleShuffle}
                            disabled={tracks.length === 0}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            className="w-[52px] h-[52px] rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 shadow-lg"
                        >
                            <Shuffle className="w-5 h-5 text-white/60" />
                        </motion.button>
                        
                        {playlist && (
                            <PlaylistOptionsMenu
                                playlistId={id}
                                playlistTitle={playlist.title}
                                onRenameClick={() => setIsRenaming(true)}
                                onDeleteConfirm={handleDeletePlaylist}
                            />
                        )}
                    </div>

                    {/* Track List */}
                    <div className="px-3 sm:px-6 relative z-10">
                        {tracks.length > 0 && (
                            <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 pb-3 mb-2 border-b border-white/[0.06]">
                                <span className="w-4 hidden sm:block flex-shrink-0" />
                                <span className="w-6 text-center text-[10px] text-white/20 font-bold uppercase tracking-widest">#</span>
                                <span className="w-11 flex-shrink-0" />
                                <span className="flex-1 text-[10px] text-white/20 font-bold uppercase tracking-widest">Трек</span>
                                <span className="hidden sm:block text-[10px] text-white/20 font-bold uppercase tracking-widest tabular-nums">Длительность</span>
                                <span className="w-24 hidden sm:block flex-shrink-0" />
                            </div>
                        )}

                        {tracks.length === 0 && !playlist ? (
                            <div className="flex flex-col items-center py-24 gap-4 text-center opacity-40">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                    <Music2 className="w-10 h-10 text-white" />
                                </motion.div>
                            </div>
                        ) : tracks.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col flex-1 items-center justify-center py-32 gap-6 text-center"
                            >
                                <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/[0.04] shadow-2xl flex items-center justify-center">
                                    <Music2 className="w-10 h-10 text-white/20" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white/30 mb-2">Плейлист пуст</p>
                                    <p className="text-sm text-white/15 max-w-sm leading-relaxed">
                                        Добавляйте треки в плейлист, чтобы слушать их здесь. Ищите ваши любимые треки и собирайте коллекции.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <Reorder.Group
                                axis="y"
                                values={tracks}
                                onReorder={setTracks}
                                className="flex flex-col gap-1 w-full"
                                as="div"
                            >
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
                            </Reorder.Group>
                        )}
                    </div>
                </div>
            </div>
            
        </div>
    );
}
