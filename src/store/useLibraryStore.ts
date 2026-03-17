import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track, Playlist } from '@/lib/youtube';

interface LibraryState {
    likedTracks: Track[];
    savedPlaylists: Playlist[];
    loading: boolean;

    // Actions
    toggleLikeTrack: (track: Track) => Promise<void>;
    toggleSavePlaylist: (playlist: Playlist) => Promise<void>;
    sync: () => Promise<void>;

    // Helpers
    isTrackLiked: (trackId: string) => boolean;
    isPlaylistSaved: (playlistId: string) => boolean;
    clearLocal: () => void;
}

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set, get) => ({
            likedTracks: [],
            savedPlaylists: [],
            loading: false,

            sync: async () => {
                // We don't import useAuthStore here to avoid circular dependencies if any
                // instead we'll assume the caller knows when to sync
                set({ loading: true });
                try {
                    const [resTracks, resPlaylists] = await Promise.all([
                        fetch("/api/library/liked-tracks"),
                        fetch("/api/library/saved-playlists")
                    ]);

                    if (resTracks.ok && resPlaylists.ok) {
                        const dataTracks = await resTracks.json();
                        const dataPlaylists = await resPlaylists.json();
                        set({
                            likedTracks: dataTracks.tracks,
                            savedPlaylists: dataPlaylists.playlists,
                            loading: false
                        });
                    }
                } catch (error) {
                    console.error("[useLibraryStore] Sync failed:", error);
                } finally {
                    set({ loading: false });
                }
            },

            toggleLikeTrack: async (track) => {
                const { likedTracks } = get();
                const exists = likedTracks.some(t => t.id === track.id);

                // Optimistic UI update
                const newTracks = exists
                    ? likedTracks.filter(t => t.id !== track.id)
                    : [track, ...likedTracks];

                set({ likedTracks: newTracks });

                // Backend sync (fire and forget or handle error)
                try {
                    if (exists) {
                        await fetch("/api/library/liked-tracks", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ trackId: track.id }),
                        });
                    } else {
                        await fetch("/api/library/liked-tracks", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ track }),
                        });
                    }
                } catch (err) {
                    console.error("[useLibraryStore] Toggle like sync failed:", err);
                    // In a real app, you might want to rollback the UI here if needed
                }
            },

            toggleSavePlaylist: async (playlist) => {
                const { savedPlaylists } = get();
                const exists = savedPlaylists.some(p => p.id === playlist.id);

                // Optimistic UI update
                const newPlaylists = exists
                    ? savedPlaylists.filter(p => p.id !== playlist.id)
                    : [playlist, ...savedPlaylists];

                set({ savedPlaylists: newPlaylists });

                // Backend sync
                try {
                    if (exists) {
                        await fetch("/api/library/saved-playlists", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ playlistId: playlist.id }),
                        });
                    } else {
                        await fetch("/api/library/saved-playlists", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ playlist }),
                        });
                    }
                } catch (err) {
                    console.error("[useLibraryStore] Toggle playlist sync failed:", err);
                }
            },

            isTrackLiked: (trackId: string) => {
                return get().likedTracks.some(t => t.id === trackId);
            },

            isPlaylistSaved: (playlistId: string) => {
                return get().savedPlaylists.some(p => p.id === playlistId);
            },

            clearLocal: () => {
                set({ likedTracks: [], savedPlaylists: [] });
                // Wipe persisted state entirely
                if (typeof window !== "undefined") {
                    localStorage.removeItem("aura-music-library");
                }
            }
        }),
        {
            name: 'aura-music-library',
        }
    )
);
