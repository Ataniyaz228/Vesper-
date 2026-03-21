import { create } from 'zustand';
import { Track } from '@/lib/youtube';
import { usePlayerUIStore } from './usePlayerUIStore';

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
    originalQueue: Track[];   // copy before shuffle, used to restore on shuffle-off

    // Playback options
    shuffle: boolean;
    repeatMode: 'none' | 'one' | 'all';

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

    // Playback option actions
    toggleShuffle: () => void;
    cycleRepeat: () => void;

    // Queue actions
    addToQueue: (track: Track) => void;
    removeFromQueue: (index: number) => void;
    reorderQueue: (from: number, to: number) => void;
    clearUserQueue: () => void;

    // Crossfade
    setCrossfadeDuration: (n: number) => void;

    // ── Deprecated UI accessors (use usePlayerUIStore instead) ─────────────────
    /** @deprecated use usePlayerUIStore */
    isFullScreenPlayerOpen: boolean;
    /** @deprecated use usePlayerUIStore */
    isQueueOpen: boolean;
    /** @deprecated use usePlayerUIStore */
    toggleFullScreen: () => void;
    /** @deprecated use usePlayerUIStore */
    setFullScreen: (val: boolean) => void;
    /** @deprecated use usePlayerUIStore */
    setQueueOpen: (val: boolean) => void;
    /** @deprecated use usePlayerUIStore */
    toggleQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    // Initial Audio State
    isPlaying: false,
    volume: 1,
    progress: 0,
    duration: 0,
    seekTarget: null,
    currentTrack: null,
    queue: [],
    userQueue: [],
    originalQueue: [],
    crossfadeDuration: 4,
    shuffle: false,
    repeatMode: 'none',

    listenAccumulator: 0,
    wasReported: false,
    isLoading: false,

    // ── Deprecated UI bridges (delegates to usePlayerUIStore) ─────────────────
    get isFullScreenPlayerOpen() { return usePlayerUIStore.getState().isFullScreenPlayerOpen; },
    get isQueueOpen() { return usePlayerUIStore.getState().isQueueOpen; },
    toggleFullScreen: () => usePlayerUIStore.getState().toggleFullScreen(),
    setFullScreen: (val) => usePlayerUIStore.getState().setFullScreen(val),
    setQueueOpen: (val) => usePlayerUIStore.getState().setQueueOpen(val),
    toggleQueue: () => usePlayerUIStore.getState().toggleQueue(),

    setIsLoading: (val) => set({ isLoading: val }),

    // ── Playback options ──────────────────────────────────────────────
    toggleShuffle: () => set((s) => {
        const turningOn = !s.shuffle;
        if (turningOn) {
            // Save original queue, then Fisher-Yates shuffle
            const original = [...s.queue];
            const shuffled = [...s.queue];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            // Move current track to front of shuffled list so "next" is truly random
            if (s.currentTrack) {
                const ci = shuffled.findIndex(t => t.id === s.currentTrack!.id);
                if (ci > 0) { shuffled.splice(ci, 1); shuffled.unshift(s.currentTrack); }
            }
            return { shuffle: true, originalQueue: original, queue: shuffled };
        } else {
            // Restore original order
            const restored = s.originalQueue.length > 0 ? s.originalQueue : s.queue;
            return { shuffle: false, queue: restored, originalQueue: [] };
        }
    }),
    cycleRepeat: () => set((s) => ({
        repeatMode: s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none'
    })),

    // ── Crossfade ───────────────────────────────────────────────────
    setCrossfadeDuration: (n) => set({ crossfadeDuration: Math.max(0, Math.min(12, n)) }),

    // ── Seek ──────────────────────────────────────────────────────
    seekTo: (time: number) => {
        set({ seekTarget: time, progress: time, listenAccumulator: 0 });
    },
    clearSeekTarget: () => set({ seekTarget: null }),

    // ── Play ──────────────────────────────────────────────────────
    playTrack: (track, queue) => {
        set((s) => ({
            currentTrack: track,
            isPlaying: true,
            progress: 0,
            listenAccumulator: 0,
            wasReported: false,
            isLoading: true,
            ...(queue && {
                queue,
                // Reset originalQueue when a new context is loaded
                originalQueue: s.shuffle ? queue : [],
            }),
        }));
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

        // Guard: skip if user has no session cookie — avoids guaranteed 401
        if (typeof document !== 'undefined' && !document.cookie.includes('aura_session')) return;

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
            console.error('Failed to report listen', e);
        }
    },

    // ── Navigation ────────────────────────────────────────────────
    nextTrack: () => {
        const { currentTrack, userQueue, queue, shuffle, repeatMode } = get();
        if (!currentTrack) return;

        const base = {
            isPlaying: true,
            progress: 0,
            listenAccumulator: 0,
            wasReported: false,
            isLoading: true,
        };

        // 1. Repeat one — restart the current track
        if (repeatMode === 'one') {
            set({ ...base, currentTrack, seekTarget: 0 });
            return;
        }

        // 2. User queue has priority (ignores shuffle)
        if (userQueue.length > 0) {
            const [next, ...rest] = userQueue;
            set({ ...base, currentTrack: next, userQueue: rest });
            return;
        }

        // 3. Auto queue with shuffle or sequential
        if (queue.length === 0) return;

        if (shuffle) {
            const candidates = queue.filter(t => t.id !== currentTrack.id);
            if (candidates.length === 0) return;
            const next = candidates[Math.floor(Math.random() * candidates.length)];
            set({ ...base, currentTrack: next });
            return;
        }

        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);

        // End of queue
        if (currentIndex === -1 || currentIndex === queue.length - 1) {
            if (repeatMode === 'all') {
                // Wrap around to first track
                set({ ...base, currentTrack: queue[0] });
            } else {
                // repeatMode === 'none' — stop
                set({ isPlaying: false, progress: 0, listenAccumulator: 0, wasReported: false, isLoading: false });
            }
            return;
        }

        set({ ...base, currentTrack: queue[currentIndex + 1] });
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
