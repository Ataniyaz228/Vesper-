"use client";

import React, { useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { X, GripVertical, Trash2, ListMusic, Music2 } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { cn, cleanTitle } from "@/lib/utils";
import Image from "next/image";
import { Track } from "@/lib/youtube";

// ── Single row in the queue ───────────────────────────────────────────────────
function QueueItem({
    track,
    index,
    isCurrent,
    onRemove,
}: {
    track: Track;
    index: number;
    isCurrent: boolean;
    onRemove: (i: number) => void;
}) {
    return (
        <Reorder.Item
            value={track}
            id={track.id}
            className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-xl transition-colors select-none",
                isCurrent
                    ? "bg-white/10 border border-white/10"
                    : "hover:bg-white/5"
            )}
            style={{ cursor: "grab" }}
        >
            {/* drag handle */}
            <GripVertical className="w-4 h-4 text-white/20 group-hover:text-white/40 flex-shrink-0" />

            {/* art */}
            <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                {track.albumImageUrl && (
                    <Image src={track.albumImageUrl} alt="" fill className="object-cover" unoptimized />
                )}
            </div>

            {/* info */}
            <div className="flex flex-col min-w-0 flex-1">
                <span className={cn("text-sm font-medium truncate leading-tight", isCurrent ? "text-white" : "text-white/80")}>
                    {cleanTitle(track.title)}
                </span>
                <span className="text-xs text-white/35 truncate">{track.artist}</span>
            </div>

            {/* remove */}
            <button
                onClick={() => onRemove(index)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-all flex-shrink-0"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </Reorder.Item>
    );
}

// ── Auto-queue simple item (no drag) ─────────────────────────────────────────
function AutoQueueItem({ track, isCurrent }: { track: Track; isCurrent: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl",
            isCurrent ? "bg-white/8" : ""
        )}>
            <div className="w-4 h-4 flex-shrink-0" /> {/* spacer for grip */}
            <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                {track.albumImageUrl && (
                    <Image src={track.albumImageUrl} alt="" fill className="object-cover" unoptimized />
                )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm text-white/60 truncate leading-tight">{cleanTitle(track.title)}</span>
                <span className="text-xs text-white/30 truncate">{track.artist}</span>
            </div>
        </div>
    );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="px-3 pt-4 pb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">{children}</span>
        </div>
    );
}

// ── Main QueuePanel ───────────────────────────────────────────────────────────
export function QueuePanel() {
    const {
        isQueueOpen,
        setQueueOpen,
        currentTrack,
        userQueue,
        queue,
        removeFromQueue,
        reorderQueue,
        clearUserQueue,
        playTrack,
    } = usePlayerStore();

    const handleReorder = useCallback(
        (newOrder: Track[]) => {
            // Find which item moved by comparing new order with userQueue
            const oldOrder = usePlayerStore.getState().userQueue;
            if (newOrder.length !== oldOrder.length) return;
            const from = oldOrder.findIndex((t, i) => t.id !== newOrder[i]?.id);
            const to = newOrder.findIndex((t, i) => t.id !== oldOrder[i]?.id);
            if (from !== -1 && to !== -1) reorderQueue(from, to);
        },
        [reorderQueue]
    );

    // Auto queue: tracks after current in the context queue
    const currentIdx = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1;
    const upNextAuto = currentIdx >= 0 ? queue.slice(currentIdx + 1, currentIdx + 16) : [];

    const isEmpty = userQueue.length === 0 && upNextAuto.length === 0;

    return (
        <AnimatePresence>
            {isQueueOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setQueueOpen(false)}
                        className="fixed inset-0 z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        key="panel"
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 280 }}
                        className="fixed right-4 bottom-28 z-50 w-80 rounded-2xl border border-white/8 overflow-hidden flex flex-col"
                        style={{
                            background: "rgba(10,10,14,0.97)",
                            backdropFilter: "blur(40px)",
                            boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
                            maxHeight: "70vh",
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <ListMusic className="w-4 h-4 text-white/50" />
                                <span className="text-sm font-semibold text-white">Очередь</span>
                                {userQueue.length > 0 && (
                                    <span className="text-xs text-white/30 bg-white/6 rounded-full px-2 py-0.5">
                                        {userQueue.length}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {userQueue.length > 0 && (
                                    <button
                                        onClick={clearUserQueue}
                                        className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                                    >
                                        Очистить
                                    </button>
                                )}
                                <button
                                    onClick={() => setQueueOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/70 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 py-1">
                            {/* Now Playing */}
                            {currentTrack && (
                                <>
                                    <SectionLabel>Сейчас играет</SectionLabel>
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl mx-1 bg-white/6 border border-white/8">
                                        <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                            {currentTrack.albumImageUrl && (
                                                <Image src={currentTrack.albumImageUrl} alt="" fill className="object-cover" unoptimized />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-sm font-medium truncate text-white leading-tight">
                                                {cleanTitle(currentTrack.title)}
                                            </span>
                                            <span className="text-xs text-white/40 truncate">{currentTrack.artist}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* User Queue (draggable) */}
                            {userQueue.length > 0 && (
                                <>
                                    <SectionLabel>Далее в очереди</SectionLabel>
                                    <Reorder.Group
                                        axis="y"
                                        values={userQueue}
                                        onReorder={handleReorder}
                                        className="flex flex-col gap-0.5 px-1"
                                    >
                                        {userQueue.map((track, i) => (
                                            <QueueItem
                                                key={track.id}
                                                track={track}
                                                index={i}
                                                isCurrent={false}
                                                onRemove={removeFromQueue}
                                            />
                                        ))}
                                    </Reorder.Group>
                                </>
                            )}

                            {/* Auto queue */}
                            {upNextAuto.length > 0 && (
                                <>
                                    <SectionLabel>Из контекста</SectionLabel>
                                    <div className="flex flex-col gap-0.5 px-1">
                                        {upNextAuto.map((track) => (
                                            <AutoQueueItem
                                                key={track.id}
                                                track={track}
                                                isCurrent={false}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {isEmpty && (
                                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                                    <Music2 className="w-8 h-8 text-white/15" />
                                    <p className="text-sm text-white/30">Очередь пуста</p>
                                    <p className="text-xs text-white/20 max-w-[180px]">
                                        Нажми «···» на треке, чтобы добавить его сюда
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
