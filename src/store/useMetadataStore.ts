import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface MetadataState {
    enhancedCovers: Record<string, string>; // trackId -> url
    setEnhancedCover: (trackId: string, url: string) => void;
    getCover: (trackId: string, fallbackUrl?: string) => string | undefined;
}

export const useMetadataStore = create<MetadataState>()(
    persist(
        (set, get) => ({
            enhancedCovers: {},

            setEnhancedCover: (trackId, url) => {
                set((state) => ({
                    enhancedCovers: {
                        ...state.enhancedCovers,
                        [trackId]: url
                    }
                }));
            },

            getCover: (trackId, fallbackUrl) => {
                return get().enhancedCovers[trackId] || fallbackUrl;
            }
        }),
        {
            name: 'aura-metadata-cache',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
