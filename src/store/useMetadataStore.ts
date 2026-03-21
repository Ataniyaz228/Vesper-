import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const MAX_CACHE_SIZE = 500;

// ── In-memory LRU order (NOT in Zustand state — avoids re-renders on every read)
const lruOrder: string[] = [];
function bumpLRU(id: string) {
    const i = lruOrder.indexOf(id);
    if (i !== -1) lruOrder.splice(i, 1);
    lruOrder.push(id);
}

interface MetadataState {
    enhancedCovers: Record<string, string>;
    setEnhancedCover: (trackId: string, url: string) => void;
    getCover: (trackId: string, fallbackUrl?: string) => string | undefined;
    clearOldEntries: () => void;
}

export const useMetadataStore = create<MetadataState>()(
    persist(
        (set, get) => ({
            enhancedCovers: {},

            setEnhancedCover: (trackId, url) => {
                bumpLRU(trackId);
                set((state) => {
                    const newCovers = { ...state.enhancedCovers, [trackId]: url };

                    // LRU eviction — remove oldest entries when over limit
                    if (lruOrder.length > MAX_CACHE_SIZE) {
                        const toRemove = lruOrder.splice(0, lruOrder.length - MAX_CACHE_SIZE);
                        toRemove.forEach((id) => delete newCovers[id]);
                    }

                    return { enhancedCovers: newCovers };
                });
            },

            // Pure read — bumps LRU in memory only, NEVER calls set() → no re-renders
            getCover: (trackId, fallbackUrl) => {
                const cover = get().enhancedCovers[trackId];
                if (cover) bumpLRU(trackId); // update order without triggering re-render
                return cover ?? fallbackUrl;
            },

            clearOldEntries: () => {
                const keepIds = new Set(lruOrder.slice(-200));
                set((state) => {
                    const newCovers: Record<string, string> = {};
                    keepIds.forEach((id) => {
                        if (state.enhancedCovers[id]) newCovers[id] = state.enhancedCovers[id];
                    });
                    return { enhancedCovers: newCovers };
                });
            },
        }),
        {
            name: 'vesper-metadata-cache',
            storage: createJSONStorage(() => localStorage),
            version: 1,
            migrate: (persistedState) => persistedState as MetadataState,
        }
    )
);

// ── Migrate legacy 'aura-metadata-cache' key on first load ────────────────────
if (typeof window !== 'undefined') {
    const oldData = localStorage.getItem('aura-metadata-cache');
    if (oldData) {
        try {
            const parsed = JSON.parse(oldData) as { state?: { enhancedCovers?: Record<string, string> } };
            if (parsed?.state?.enhancedCovers) {
                const store = useMetadataStore.getState();
                Object.entries(parsed.state.enhancedCovers)
                    .slice(-200)
                    .forEach(([id, url]) => store.setEnhancedCover(id, url));
            }
        } catch {
            /* intentionally ignored: old cache key migration */
        }
        localStorage.removeItem('aura-metadata-cache');
    }
}
