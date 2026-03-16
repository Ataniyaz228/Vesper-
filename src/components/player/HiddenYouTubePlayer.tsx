"use client";

import React, { useEffect, useRef, useState } from "react";
import YouTube, { YouTubeProps, YouTubePlayer } from "react-youtube";
import { usePlayerStore } from "@/store/usePlayerStore";

export const HiddenYouTubePlayer = () => {
    const {
        currentTrack,
        isPlaying,
        volume,
        setProgress,
        setDuration,
        nextTrack,
        seekTarget,
        clearSeekTarget,
        setIsLoading
    } = usePlayerStore();

    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (player) {
            try { player.setVolume(volume * 100); } catch { }
        }
    }, [volume, player]);

    useEffect(() => {
        if (player && seekTarget !== null) {
            try {
                player.seekTo(seekTarget, true);
                clearSeekTarget();
            } catch { }
        }
    }, [seekTarget, player, clearSeekTarget]);

    useEffect(() => {
        if (player && currentTrack) {
            try {
                if (isPlaying) {
                    player.playVideo();
                } else {
                    player.pauseVideo();
                }
            } catch { }
        }
    }, [isPlaying, player, currentTrack]);

    useEffect(() => {
        if (player && isPlaying) {
            progressIntervalRef.current = setInterval(async () => {
                try {
                    const time = await player.getCurrentTime();
                    setProgress(time);
                } catch { }
            }, 500);
        } else {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [player, isPlaying, setProgress]);

    const onReady: YouTubeProps['onReady'] = (event) => {
        setPlayer(event.target);
        setIsLoading(false);
        try {
            event.target.setVolume(volume * 100);
            if (isPlaying) event.target.playVideo();
        } catch { }
    };

    const onStateChange: YouTubeProps['onStateChange'] = (event) => {
        try {
            // 1 = playing, -1 = unstarted, 3 = buffering, 5 = cued
            if (event.data === 1) {
                setIsLoading(false);
                setDuration(event.target.getDuration());
            } else if (event.data === 3) {
                setIsLoading(true);
            }

            if (event.data === 0) {
                nextTrack();
            }
        } catch { }
    };

    if (!isMounted || !currentTrack) return null;

    return (
        <div className="fixed -top-[9999px] -left-[9999px] w-16 h-16 opacity-0 pointer-events-none">
            {/* key forces full remount when track changes — critical for reliable track switching */}
            <YouTube
                key={currentTrack.id}
                videoId={currentTrack.id}
                opts={{
                    height: '64',
                    width: '64',
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        iv_load_policy: 3,
                        modestbranding: 1,
                        rel: 0,
                        showinfo: 0,
                        origin: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
                        enablejsapi: 1,
                    },
                }}
                onReady={onReady}
                onStateChange={onStateChange}
                onError={() => nextTrack()} // skip track if it fails to load
            />
        </div>
    );
};
