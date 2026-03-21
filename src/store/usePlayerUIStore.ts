import { create } from 'zustand';

interface PlayerUIState {
    isFullScreenPlayerOpen: boolean;
    isQueueOpen: boolean;
    toggleFullScreen: () => void;
    setFullScreen: (val: boolean) => void;
    setQueueOpen: (val: boolean) => void;
    toggleQueue: () => void;
}

export const usePlayerUIStore = create<PlayerUIState>((set) => ({
    isFullScreenPlayerOpen: false,
    isQueueOpen: false,
    toggleFullScreen: () => set((s) => ({ isFullScreenPlayerOpen: !s.isFullScreenPlayerOpen })),
    setFullScreen: (val) => set({ isFullScreenPlayerOpen: val }),
    setQueueOpen: (val) => set({ isQueueOpen: val }),
    toggleQueue: () => set((s) => ({ isQueueOpen: !s.isQueueOpen })),
}));
