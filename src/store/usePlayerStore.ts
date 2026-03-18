import { create } from 'zustand';
import { Track } from '@/lib/youtube';

interface PlayerState {
    // Audio State
    isPlaying: boolean;
    volume: number;
    progress: number;
    duration: number;
    seekTarget: number | null;

    // Queue State
    currentTrack: Track | null;
    queue: Track[];           // auto queue (album / playlist context)
    userQueue: Track[];       // manually added by user — plays first

    // Crossfade
    crossfadeDuration: number; // seconds, 0 = off

    // Stats tracking
    listenAccumulator: number;
    wasReported: boolean;

    isLoading: boolean;

    // ── Actions ───────────────────────────────────────────────────
    playTrack: (track: Track, queue?: Track[]) => void;
    togglePlay: () => void;
    setVolume: (volume: number) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    setIsLoading: (val: boolean) => void;
    seekTo: (time: number) => void;
    clearSeekTarget: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    setTrackArt: (trackId: string, url: string) => void;
    reportListen: () => Promise<void>;

    // Queue actions
    addToQueue: (track: Track) => void;
    removeFromQueue: (index: number) => void;
    reorderQueue: (from: number, to: number) => void;
    clearUserQueue: () => void;

    // Crossfade
    setCrossfadeDuration: (n: number) => void;

    // UI State
    isFullScreenPlayerOpen: boolean;
    isQueueOpen: boolean;
    toggleFullScreen: () => void;
    setFullScreen: (val: boolean) => void;
    setQueueOpen: (val: boolean) => void;
    toggleQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    // Initial State
    isPlaying: false,
    volume: 1,
    progress: 0,
    duration: 0,
    seekTarget: null,
    currentTrack: null,
    queue: [],
    userQueue: [],
    crossfadeDuration: 4,
    isFullScreenPlayerOpen: false,
    isQueueOpen: false,

    listenAccumulator: 0,
    wasReported: false,
    isLoading: false,

    // ── UI ────────────────────────────────────────────────────────
    toggleFullScreen: () => set((s) => ({ isFullScreenPlayerOpen: !s.isFullScreenPlayerOpen })),
    setFullScreen: (val) => set({ isFullScreenPlayerOpen: val }),
    setIsLoading: (val) => set({ isLoading: val }),
    setQueueOpen: (val) => set({ isQueueOpen: val }),
    toggleQueue: () => set((s) => ({ isQueueOpen: !s.isQueueOpen })),

    // ── Crossfade ─────────────────────────────────────────────────
    setCrossfadeDuration: (n) => set({ crossfadeDuration: Math.max(0, Math.min(12, n)) }),

    // ── Seek ──────────────────────────────────────────────────────
    seekTo: (time: number) => {
        set({ seekTarget: time, progress: time, listenAccumulator: 0 });
    },
    clearSeekTarget: () => set({ seekTarget: null }),

    // ── Play ──────────────────────────────────────────────────────
    playTrack: (track, queue) => {
        set({
            currentTrack: track,
            isPlaying: true,
            progress: 0,
            listenAccumulator: 0,
            wasReported: false,
            isLoading: true,
            ...(queue && { queue }),
        });
    },

    togglePlay: () => set((s) => ({
        isPlaying: s.currentTrack ? !s.isPlaying : false
    })),

    setVolume: (volume) => {
        set({ volume: Math.max(0, Math.min(1, volume)) });
    },

    setProgress: (progress) => {
        const state = get();
        if (!state.currentTrack) { set({ progress }); return; }

        const delta = Math.abs(progress - state.progress);
        let newAccumulator = state.listenAccumulator;
        if (state.isPlaying && delta > 0 && delta < 2) {
            newAccumulator += delta;
        }
        set({ progress, listenAccumulator: newAccumulator });

        const isNearEnd = state.duration > 0 && progress >= state.duration - 15;
        const hasListenedEnough = newAccumulator >= Math.min(30, state.duration * 0.5);
        if (isNearEnd && hasListenedEnough && !state.wasReported) {
            get().reportListen();
        }
    },

    setDuration: (duration) => set({ duration }),

    reportListen: async () => {
        const { currentTrack, wasReported, duration } = get();
        if (!currentTrack || wasReported) return;
        set({ wasReported: true });
        try {
            const trackWithDuration = {
                ...currentTrack,
                durationMs: (currentTrack.durationMs && currentTrack.durationMs > 0)
                    ? currentTrack.durationMs
                    : Math.round(duration * 1000)
            };
            await fetch('/api/stats/listen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track: trackWithDuration })
            });
        } catch (e) {
            console.error("Failed to report listen", e);
        }
    },

    // ── Navigation ────────────────────────────────────────────────
    nextTrack: () => {
        const { currentTrack, userQueue, queue } = get();
        if (!currentTrack) return;

        // User queue has priority
        if (userQueue.length > 0) {
            const [next, ...rest] = userQueue;
            set({
                currentTrack: next,
                userQueue: rest,
                isPlaying: true,
                progress: 0,
                listenAccumulator: 0,
                wasReported: false,
                isLoading: true,
            });
            return;
        }

        // Fall back to auto queue
        if (queue.length === 0) return;
        const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
        if (currentIndex === -1 || currentIndex === queue.length - 1) {
            set({ isPlaying: false, progress: 0, listenAccumulator: 0, wasReported: false, isLoading: false });
            return;
        }
        set({
            currentTrack: queue[currentIndex + 1],
            isPlaying: true,
            progress: 0,
            listenAccumulator: 0,
            wasReported: false,
            isLoading: true,
        });
    },

    prevTrack: () => {
        const { currentTrack, queue, progress } = get();
        if (!currentTrack || queue.length === 0) return;

        if (progress > 3) { get().seekTo(0); return; }

        const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
        if (currentIndex <= 0) { get().seekTo(0); return; }

        set({
            currentTrack: queue[currentIndex - 1],
            isPlaying: true,
            progress: 0,
            listenAccumulator: 0,
            wasReported: false,
            isLoading: true,
        });
    },

    // ── Queue management ──────────────────────────────────────────
    addToQueue: (track) => {
        set((s) => ({ userQueue: [...s.userQueue, track] }));
    },

    removeFromQueue: (index) => {
        set((s) => {
            const next = [...s.userQueue];
            next.splice(index, 1);
            return { userQueue: next };
        });
    },

    reorderQueue: (from, to) => {
        set((s) => {
            const next = [...s.userQueue];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return { userQueue: next };
        });
    },

    clearUserQueue: () => set({ userQueue: [] }),

    // ── Art ───────────────────────────────────────────────────────
    setTrackArt: (trackId: string, url: string) => {
        const { currentTrack, queue, userQueue } = get();
        if (currentTrack?.id === trackId) {
            set({ currentTrack: { ...currentTrack, albumImageUrl: url } });
        }
        const newQueue = queue.map(t => t.id === trackId ? { ...t, albumImageUrl: url } : t);
        const newUserQueue = userQueue.map(t => t.id === trackId ? { ...t, albumImageUrl: url } : t);
        set({ queue: newQueue, userQueue: newUserQueue });
    },
}));
