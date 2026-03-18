import { create } from 'zustand';
import { Track } from '@/lib/youtube';

/** A user-created playlist metadata entry (from the list endpoint) */
export interface UserPlaylist {
    id: string;
    title: string;
    createdAt: string;
    trackCount: number;
    coverUrl?: string | null;
    tracks?: Track[]; // populated when fully loaded
}

interface PlaylistsState {
    playlists: UserPlaylist[];
    loading: boolean;
    error: string | null;

    // ── Actions ───────────────────────────────────────────────────
    /** Load all playlists for the signed-in user */
    fetchPlaylists: () => Promise<void>;

    /** Create a new playlist and return it */
    createPlaylist: (title?: string) => Promise<UserPlaylist | null>;

    /** Rename a playlist */
    renamePlaylist: (id: string, title: string) => Promise<void>;

    /** Delete a playlist and remove it from local state */
    deletePlaylist: (id: string) => Promise<void>;

    /** Load a single playlist with tracks (populates into list) */
    fetchPlaylist: (id: string) => Promise<UserPlaylist | null>;

    /** Add a track to a playlist (optimistic count) */
    addTrack: (playlistId: string, track: Track) => Promise<boolean>;

    /** Remove a track from a playlist */
    removeTrack: (playlistId: string, trackId: string) => Promise<void>;
}

export const usePlaylistsStore = create<PlaylistsState>((set, get) => ({
    playlists: [],
    loading: false,
    error: null,

    fetchPlaylists: async () => {
        set({ loading: true, error: null });
        try {
            const res = await fetch('/api/playlists');
            if (!res.ok) throw new Error('Failed to fetch playlists');
            const { playlists } = await res.json();
            set({ playlists, loading: false });
        } catch (err) {
            set({ loading: false, error: String(err) });
        }
    },

    createPlaylist: async (title = 'Новый плейлист') => {
        try {
            const res = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });
            if (!res.ok) return null;
            const { playlist } = await res.json();
            set((s) => ({ playlists: [playlist, ...s.playlists] }));
            return playlist;
        } catch { return null; }
    },

    renamePlaylist: async (id, title) => {
        // Optimistic
        set((s) => ({
            playlists: s.playlists.map(p => p.id === id ? { ...p, title } : p)
        }));
        try {
            await fetch(`/api/playlists/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });
        } catch (err) {
            console.error('[usePlaylistsStore] renamePlaylist error:', err);
        }
    },

    deletePlaylist: async (id) => {
        set((s) => ({ playlists: s.playlists.filter(p => p.id !== id) }));
        try {
            await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
        } catch (err) {
            console.error('[usePlaylistsStore] deletePlaylist error:', err);
        }
    },

    fetchPlaylist: async (id) => {
        try {
            const res = await fetch(`/api/playlists/${id}`);
            if (!res.ok) return null;
            const { playlist } = await res.json();
            set((s) => ({
                playlists: s.playlists.map(p => p.id === id ? { ...p, ...playlist } : p)
            }));
            return playlist;
        } catch { return null; }
    },

    addTrack: async (playlistId, track) => {
        // Optimistic count bump
        set((s) => ({
            playlists: s.playlists.map(p =>
                p.id === playlistId
                    ? { ...p, trackCount: p.trackCount + 1, coverUrl: p.coverUrl ?? track.albumImageUrl }
                    : p
            )
        }));
        try {
            const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track }),
            });
            return res.ok;
        } catch {
            // Roll back
            set((s) => ({
                playlists: s.playlists.map(p =>
                    p.id === playlistId ? { ...p, trackCount: Math.max(0, p.trackCount - 1) } : p
                )
            }));
            return false;
        }
    },

    removeTrack: async (playlistId, trackId) => {
        // Optimistic update in tracks array and count
        set((s) => ({
            playlists: s.playlists.map(p => {
                if (p.id !== playlistId) return p;
                const tracks = p.tracks?.filter(t => t.id !== trackId);
                return { ...p, tracks, trackCount: Math.max(0, p.trackCount - 1) };
            })
        }));
        try {
            await fetch(`/api/playlists/${playlistId}/tracks`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId }),
            });
        } catch (err) {
            console.error('[usePlaylistsStore] removeTrack error:', err);
        }
    },
}));
