"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Label, T, AURA_DATA } from "@/components/vesper/Shared";
import { Hero } from "@/components/vesper/Hero";
import { Stats } from "@/components/vesper/Stats";
import { GenreDNA } from "@/components/vesper/GenreDNA";
import { TrackList } from "@/components/vesper/TrackList";
import { AuraCard } from "@/components/vesper/AuraCard";

// ══════════════════════════════════════════════════════════════════
//  PAGE ROOT
// ══════════════════════════════════════════════════════════════════
interface VesperData {
    stats?: {
        totalPlays: number;
        totalSeconds: number;
        uniqueTracks: number;
        activeDays: number;
        lastResonated: string | null;
    };
    topArtists?: { name: string }[];
    topTracks?: { id: string | number; title: string; artist: string; dur: string; img: string; }[];
    topGenres?: { name: string; count: number }[];
    error?: string;
}

export default function AuraPage() {
    const [data, setData] = useState<VesperData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/stats/summary");
                const stats = await res.json();
                if (stats.error) {
                    setIsLoading(false);
                    return;
                }
                setData(stats);
            } catch (e) {
                console.error("Failed to load stats", e);
            } finally {
                setTimeout(() => setIsLoading(false), 1500);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b]">
                <motion.span className="w-12 h-12 rounded-full block"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                    style={{ border: `1.5px solid rgba(255,255,255,0.12)`, borderTopColor: "rgba(255,255,255,0.45)" }}
                />
                <p className="mt-6 text-xs font-mono uppercase tracking-[0.28em] animate-pulse text-white/40">Compiling your vesper…</p>
            </div>
        );
    }

    const hasData = !!(data?.stats && data.stats.totalPlays > 0);

    // Adaptive time calculation
    const totalSec = data?.stats?.totalSeconds || 0;
    const timeVal = totalSec < 3600 ? Math.round(totalSec / 60) : Number((totalSec / 3600).toFixed(1));
    const timeUnit = totalSec < 3600 ? "min" : "hrs";

    const displayStats = hasData ? [
        {
            id: "time",
            label: "Total Time",
            value: timeVal,
            unit: timeUnit,
            sub: "of active listening"
        },
        {
            id: "plays",
            label: "Total Plays",
            value: data?.stats?.totalPlays || 0,
            unit: "",
            sub: data?.stats?.totalPlays === 1 ? "honest track completion" : "honest track completions"
        },
        {
            id: "tracks",
            label: "Unique Tracks",
            value: data?.stats?.uniqueTracks || 0,
            unit: "",
            sub: data?.stats?.uniqueTracks === 1 ? "distinct soundscape" : "distinct soundscapes"
        },
        {
            id: "streak",
            label: "Active Days",
            value: data?.stats?.activeDays || 0,
            unit: "d",
            sub: "out of the last 30"
        },
    ] : AURA_DATA.stats;

    const displayTracks = (hasData && data?.topTracks) ? data.topTracks : AURA_DATA.tracks;

    const identity = {
        ...AURA_DATA.identity,
        name: hasData ? (data?.topArtists?.[0]?.name || "Sonic Architect") : AURA_DATA.identity.name,
        description: hasData
            ? `Built from your collective resonance and honest listening sessions.`
            : `Your sonic journey is just beginning. Start resonance to build your Vesper.`,
        lastResonated: (data?.stats?.lastResonated as unknown as { title: string; artist: string }) || null
    };

    const dnaData = data?.topGenres?.map((g: { name: string; count: number }) => ({
        name: g.name,
        pct: Math.round((g.count / (data?.stats?.totalPlays || 1)) * 100)
    })) || AURA_DATA.genres;

    return (
        <main className="w-full min-h-screen font-sans overflow-x-hidden pb-40" style={{ background: T.bg, color: T.text }}>
            <div className="fixed inset-0 z-[200] pointer-events-none opacity-[0.018] mix-blend-overlay"
                style={{ backgroundImage: T.noiseUrl }}
            />

            <Hero d={identity} dna={dnaData} />

            {!hasData && (
                <section className="px-5 md:px-12 py-20 flex flex-col items-center text-center relative z-20">
                    <div className="max-w-2xl px-8 py-12 rounded-[32px] border border-white/5 bg-white/[0.02] backdrop-blur-md">
                        <Label>Initialisation</Label>
                        <h2 className="text-3xl font-black mt-6 mb-4 italic uppercase tracking-tighter">Awaiting Signal...</h2>
                        <p className="text-white/40 text-sm leading-relaxed mb-8">
                            Vesper uses <span className="text-white/80 font-bold">Honest Listening</span> logic.
                            Your statistics only count when you truly connect with a track—meaning no skips, no noise, just pure playback.
                            Finish a few songs to see your Sonic Fingerprint here.
                        </p>
                        <button
                            onClick={() => window.location.href = '/discover'}
                            className="px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl"
                        >
                            Begin Exploration
                        </button>
                    </div>
                </section>
            )}

            <div className={hasData ? "opacity-100" : "opacity-20 grayscale pointer-events-none transition-all duration-1000"}>
                <Stats data={displayStats} />

                {data?.topGenres && data.topGenres.length > 0 && (
                    <GenreDNA genres={dnaData} />
                )}

                <TrackList tracks={displayTracks} />
                <AuraCard identity={identity} stats={displayStats} genres={dnaData} />
            </div>
        </main>
    );
}
