/**
 * useAuthStore.ts — Zustand auth state
 * Syncs with /api/auth/me on boot, exposes login/register/logout actions.
 */
import { create } from "zustand";
import { useLibraryStore } from "./useLibraryStore";

interface AuthUser {
    userId: number;
    email: string;
    username: string;
}

interface AuthState {
    user: AuthUser | null;
    loading: boolean;
    hydrate: () => Promise<void>;
    login: (email: string, password: string) => Promise<string | null>;
    register: (username: string, email: string, password: string) => Promise<string | null>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,

    hydrate: async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                set({ user: data.user, loading: false });
                useLibraryStore.getState().sync();
            } else {
                set({ user: null, loading: false });
            }
        } catch {
            set({ user: null, loading: false });
        }
    },

    login: async (email, password) => {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return data.error ?? "Login failed.";
        set({ user: data.user });
        useLibraryStore.getState().sync();
        return null;
    },

    register: async (username, email, password) => {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (!res.ok) return data.error ?? "Registration failed.";
        set({ user: data.user });
        useLibraryStore.getState().sync();
        return null;
    },

    logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        set({ user: null });
        useLibraryStore.getState().clearLocal();
    },
}));
