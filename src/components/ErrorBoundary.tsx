"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error("[ErrorBoundary]", error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white/50 gap-4">
                    <p className="text-sm tracking-widest uppercase">Something went wrong</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition"
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
