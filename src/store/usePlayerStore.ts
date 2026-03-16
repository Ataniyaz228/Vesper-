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
    queue: Track[];

    // Stats tracking
    listenAccumulator: number;
    wasReported: boolean;

    isLoading: boolean;

    // Actions
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

    // UI State
    isFullScreenPlayerOpen: boolean;
    toggleFullScreen: () => void;
    setFullScreen: (val: boolean) => void;
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
    isFullScreenPlayerOpen: false,

    listenAccumulator: 0,
    wasReported: false,
    isLoading: false,

    // Actions
    toggleFullScreen: () => set((state) => ({ isFullScreenPlayerOpen: !state.isFullScreenPlayerOpen })),
    setFullScreen: (val) => set({ isFullScreenPlayerOpen: val }),
    setIsLoading: (val) => set({ isLoading: val }),

    seekTo: (time: number) => {
        // Reset accumulator on manual seek
        set({ seekTarget: time, progress: time, listenAccumulator: 0 });
    },

    clearSeekTarget: () => set({ seekTarget: null }),

    playTrack: (track, queue) => {
        set({
            currentTrack: track,
            isPlaying: true,
            progress: 0,
            listenAccumulator: 0,
            wasReported: false,
            isLoading: true,
            ...(queue && { queue })
        });
    },

    togglePlay: () => set((state) => ({
        isPlaying: state.currentTrack ? !state.isPlaying : false
    })),

    setVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ volume: clampedVolume });
    },

    setProgress: (progress) => {
        const state = get();
        if (!state.currentTrack) {
            set({ progress });
            return;
        }

        const delta = Math.abs(progress - state.progress);

        // Logical check: if delta is normal (~1s), accumulate
        let newAccumulator = state.listenAccumulator;
        if (state.isPlaying && delta > 0 && delta < 2) {
            newAccumulator += delta;
        }

        set({ progress, listenAccumulator: newAccumulator });

        // Check if we should report
        // Condition: 15s before end AND accumulated at least 30s (or 50% of song if song is short)
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
            // Ensure we send the duration we actually got from the player
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

    nextTrack: () => {
        const { currentTrack, queue } = get();
        if (!currentTrack || queue.length === 0) return;

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
            isLoading: true
        });
    },

    prevTrack: () => {
        const { currentTrack, queue, progress } = get();
        if (!currentTrack || queue.length === 0) return;

        if (progress > 3) {
            get().seekTo(0);
            return;
        }

        const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);

        if (currentIndex <= 0) {
            get().seekTo(0);
            return;
        }

        set({
            currentTrack: queue[currentIndex - 1],
            isPlaying: true,
            progress: 0,
            listenAccumulator: 0,
            wasReported: false,
            isLoading: true
        });
    },
    setTrackArt: (trackId: string, url: string) => {
        const { currentTrack, queue } = get();
        if (currentTrack?.id === trackId) {
            set({ currentTrack: { ...currentTrack, albumImageUrl: url } });
        }
        const newQueue = queue.map(t => t.id === trackId ? { ...t, albumImageUrl: url } : t);
        set({ queue: newQueue });
    },
}));
