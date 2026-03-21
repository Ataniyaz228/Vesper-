"use client";

import React, { useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder, LayoutGroup } from "framer-motion";
import { X, GripVertical, Trash2, ListMusic, Music2, Shuffle, Repeat, Repeat1, Play } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePlayerUIStore } from "@/store/usePlayerUIStore";
import { cn, cleanTitle } from "@/lib/utils";
import Image from "next/image";
import { Track } from "@/lib/youtube";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatTime(s: number) {
    if (!s || isNaN(s) || s <= 0) return "";
    const m = Math.floor(s / 60000);
    const sec = String(Math.floor((s % 60000) / 1000)).padStart(2, "0");
    return `${m}:${sec}`;
}

// ── Draggable user-queue row ───────────────────────────────────────────────────
function QueueItem({
    track,
    index,
    isCurrent,
    onRemove,
    onClick,
}: {
    track: Track;
    index: number;
    isCurrent: boolean;
    onRemove: (i: number) => void;
    onClick: (t: Track) => void;
}) {
    return (
        <Reorder.Item
            value={track}
            id={track.id}
            as="div"
            className={cn(
                "group flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-all duration-150 cursor-grab active:cursor-grabbing select-none",
                isCurrent
                    ? "bg-white/10 border border-white/10"
                    : "hover:bg-white/[0.06]"
            )}
            whileDrag={{ scale: 1.02, opacity: 0.9, zIndex: 10 }}
        >
            {/* drag handle */}
            <GripVertical className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 flex-shrink-0 transition-colors" />

            {/* art */}
            <button
                className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 hover:opacity-80 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onClick(track); }}
            >
                {track.albumImageUrl ? (
                    <Image src={track.albumImageUrl} alt="" fill className="object-cover" unoptimized />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-3.5 h-3.5 text-white/20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-3 h-3 text-white fill-white" />
                </div>
            </button>

            {/* info */}
            <div className="flex flex-col min-w-0 flex-1" onClick={() => onClick(track)} role="button">
                <span className={cn(
                    "text-sm font-medium truncate leading-tight",
                    isCurrent ? "text-white" : "text-white/75 group-hover:text-white/90"
                )}>
                    {cleanTitle(track.title)}
                </span>
                <span className="text-[11px] text-white/30 truncate">{track.artist}</span>
            </div>

            {/* duration */}
            {track.durationMs > 0 && (
                <span className="text-[11px] text-white/25 tabular-nums flex-shrink-0">
                    {formatTime(track.durationMs)}
                </span>
            )}

            {/* remove */}
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-all flex-shrink-0"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </Reorder.Item>
    );
}

// ── Auto-queue row (clickable, animated for shuffle reorder) ─────────────────
function AutoQueueItem({
    track,
    number,
    isCurrent,
    isPast,
    onClick,
}: {
    track: Track;
    number: number;
    isCurrent?: boolean;
    isPast?: boolean;
    onClick: (t: Track) => void;
}) {
    return (
        <motion.button
            layoutId={`aq-${track.id}`}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: isPast ? 0.38 : 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", damping: 24, stiffness: 280, layout: { duration: 0.35 } }}
            className={`group w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-xl transition-colors text-left ${
                isCurrent ? "bg-white/[0.07] border border-white/[0.08]" : "hover:bg-white/[0.05]"
            }`}
            style={{ width: "calc(100% - 8px)" }}
            onClick={() => onClick(track)}
        >
            {/* position number / indicator */}
            <span className="w-5 text-center text-[11px] tabular-nums flex-shrink-0">
                {isCurrent ? (
                    <span className="inline-flex items-end gap-[2px] h-3 justify-center">
                        {[1, 0.55, 0.8].map((h, i) => (
                            <motion.span
                                key={i}
                                className="w-[2px] rounded-full bg-violet-400"
                                animate={{ scaleY: [h, h * 0.4, h] }}
                                transition={{ duration: 0.7 + i * 0.1, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                                style={{ height: "100%", transformOrigin: "bottom", display: "inline-block" }}
                            />
                        ))}
                    </span>
                ) : (
                    <span className="text-white/20">{number}</span>
                )}
            </span>

            {/* art */}
            <div className={`relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 ${
                isCurrent ? "ring-1 ring-violet-400/40" : ""
            }`}>
                {track.albumImageUrl ? (
                    <Image src={track.albumImageUrl} alt="" fill className="object-cover" unoptimized />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-3 h-3 text-white/15" />
                    </div>
                )}
            </div>

            {/* info */}
            <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-[13px] truncate leading-tight transition-colors ${
                    isCurrent
                        ? "text-white font-medium"
                        : isPast
                        ? "text-white/40"
                        : "text-white/55 group-hover:text-white/80"
                }`}>
                    {cleanTitle(track.title)}
                </span>
                <span className={`text-[11px] truncate ${
                    isPast ? "text-white/20" : "text-white/25"
                }`}>
                    {track.artist}
                </span>
            </div>

            {track.durationMs > 0 && (
                <span className="text-[11px] text-white/20 tabular-nums flex-shrink-0">{formatTime(track.durationMs)}</span>
            )}
        </motion.button>
    );
}

// ── "Now playing" mini card ────────────────────────────────────────────────────
function NowPlayingCard({ track }: { track: Track }) {
    return (
        <div className="mx-3 mb-1 rounded-xl overflow-hidden relative flex items-center gap-3 p-3 border border-white/10"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            {/* blurred art behind */}
            {track.albumImageUrl && (
                <Image
                    src={track.albumImageUrl}
                    alt="" fill
                    className="object-cover opacity-15 blur-2xl scale-125 saturate-150 pointer-events-none"
                    unoptimized
                />
            )}
            <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/15">
                {track.albumImageUrl ? (
                    <Image src={track.albumImageUrl} alt="" fill className="object-cover" unoptimized />
                ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Music2 className="w-4 h-4 text-white/20" />
                    </div>
                )}
            </div>
            <div className="relative flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold truncate text-white leading-tight">{cleanTitle(track.title)}</span>
                <span className="text-xs text-white/45 truncate">{track.artist}</span>
            </div>
            {/* waveform animation */}
            <div className="relative flex items-end gap-[2px] h-4 flex-shrink-0">
                {[1, 0.6, 0.85, 0.45, 1].map((h, i) => (
                    <motion.div
                        key={i}
                        className="w-[3px] rounded-full bg-white/50"
                        animate={{ scaleY: [h, h * 0.4, h] }}
                        transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
                        style={{ height: "100%", transformOrigin: "bottom" }}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
    return (
        <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">{children}</span>
            {count !== undefined && count > 0 && (
                <span className="text-[10px] text-white/20 bg-white/5 rounded-full px-1.5">{count}</span>
            )}
            <div className="flex-1 h-px bg-white/[0.05]" />
        </div>
    );
}

// ── Main QueuePanel ────────────────────────────────────────────────────────────
export function QueuePanel() {
    const { isQueueOpen, setQueueOpen } = usePlayerUIStore();
    const {
        currentTrack,
        userQueue,
        queue,
        removeFromQueue,
        reorderQueue,
        clearUserQueue,
        playTrack,
        shuffle,
        repeatMode,
        toggleShuffle,
        cycleRepeat,
    } = usePlayerStore();

    const panelRef = useRef<HTMLDivElement>(null);

    const handleReorder = useCallback(
        (newOrder: Track[]) => {
            const oldOrder = usePlayerStore.getState().userQueue;
            if (newOrder.length !== oldOrder.length) return;
            const from = oldOrder.findIndex((t, i) => t.id !== newOrder[i]?.id);
            const to = newOrder.findIndex((t, i) => t.id !== oldOrder[i]?.id);
            if (from !== -1 && to !== -1) reorderQueue(from, to);
        },
        [reorderQueue]
    );

    const handlePlay = useCallback(
        (track: Track) => playTrack(track, queue),
        [playTrack, queue]
    );

    // Full queue: shown together as one list, current track highlighted
    const currentIdx = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1;

    const isEmpty = userQueue.length === 0 && queue.length === 0;
    const totalNext = userQueue.length + queue.length;

    const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;

    return (
        <AnimatePresence>
            {isQueueOpen && (
                <>
                    {/* Backdrop — transparent to allow clicking through */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setQueueOpen(false)}
                        className="fixed inset-0 z-[110]"
                    />

                    {/* Panel */}
                    <motion.div
                        key="panel"
                        ref={panelRef}
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="fixed right-4 bottom-28 z-[120] w-[340px] rounded-2xl border border-white/[0.07] overflow-hidden flex flex-col"
                        style={{
                            background: "rgba(9,9,12,0.97)",
                            backdropFilter: "blur(48px)",
                            boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
                            maxHeight: "72vh",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <ListMusic className="w-3.5 h-3.5 text-white/40" />
                                <span className="text-sm font-semibold text-white/90 tracking-tight">Очередь</span>
                                {totalNext > 0 && (
                                    <span className="text-[11px] text-white/25 bg-white/[0.07] rounded-full px-2 py-0.5 tabular-nums">
                                        {totalNext}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Shuffle */}
                                <button
                                    onClick={toggleShuffle}
                                    title="Перемешать"
                                    className={cn(
                                        "p-1.5 rounded-lg transition-all",
                                        shuffle
                                            ? "text-violet-400 bg-violet-500/15"
                                            : "text-white/25 hover:text-white/60 hover:bg-white/5"
                                    )}
                                >
                                    <Shuffle className="w-3.5 h-3.5" />
                                </button>

                                {/* Repeat */}
                                <button
                                    onClick={cycleRepeat}
                                    title={repeatMode === "none" ? "Повтор выкл" : repeatMode === "all" ? "Повтор всех" : "Повтор трека"}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-all",
                                        repeatMode !== "none"
                                            ? "text-violet-400 bg-violet-500/15"
                                            : "text-white/25 hover:text-white/60 hover:bg-white/5"
                                    )}
                                >
                                    <RepeatIcon className="w-3.5 h-3.5" />
                                </button>

                                {/* Clear user queue */}
                                {userQueue.length > 0 && (
                                    <button
                                        onClick={clearUserQueue}
                                        className="text-[11px] text-white/25 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 ml-1"
                                    >
                                        Очистить
                                    </button>
                                )}

                                {/* Close */}
                                <button
                                    onClick={() => setQueueOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-all"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* ── Content ── */}
                        <div className="overflow-y-auto flex-1 pb-3" style={{ scrollbarWidth: "none" }}>

                            {/* Now Playing */}
                            {currentTrack && (
                                <>
                                    <SectionLabel>Сейчас играет</SectionLabel>
                                    <NowPlayingCard track={currentTrack} />
                                </>
                            )}

                            {/* User queue (draggable) */}
                            {userQueue.length > 0 && (
                                <>
                                    <SectionLabel count={userQueue.length}>Далее в очереди</SectionLabel>
                                    <Reorder.Group
                                        axis="y"
                                        values={userQueue}
                                        onReorder={handleReorder}
                                        className="flex flex-col gap-0.5"
                                        as="div"
                                    >
                                        <AnimatePresence initial={false}>
                                            {userQueue.map((track, i) => (
                                                <QueueItem
                                                    key={track.id}
                                                    track={track}
                                                    index={i}
                                                    isCurrent={false}
                                                    onRemove={removeFromQueue}
                                                    onClick={handlePlay}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </Reorder.Group>
                                </>
                            )}

                            {/* Full context queue — one list, layout-animated for shuffle */}
                            {queue.length > 0 && (
                                <>
                                    <SectionLabel count={queue.length}>Плейлист</SectionLabel>
                                    <LayoutGroup id="ctx-queue">
                                        <div className="flex flex-col gap-0.5">
                                            <AnimatePresence initial={false}>
                                                {queue.map((track, i) => (
                                                    <AutoQueueItem
                                                        key={track.id}
                                                        track={track}
                                                        number={i + 1}
                                                        isCurrent={track.id === currentTrack?.id}
                                                        isPast={currentIdx > 0 && i < currentIdx}
                                                        onClick={handlePlay}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </LayoutGroup>
                                </>
                            )}

                            {/* Empty State */}
                            {isEmpty && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-14 text-center gap-3"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                                        <Music2 className="w-6 h-6 text-white/15" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/35 font-medium">Очередь пуста</p>
                                        <p className="text-xs text-white/18 mt-1 max-w-[160px] leading-relaxed">
                                            Нажми ··· на треке, чтобы добавить
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

    );
}
