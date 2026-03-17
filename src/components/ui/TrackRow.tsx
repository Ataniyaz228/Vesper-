import * as React from "react";
import { cn, cleanTitle } from "@/lib/utils";
import { Play, Heart } from "lucide-react";
import { Track } from "@/lib/youtube";
import { useLibraryStore } from "@/store/useLibraryStore";

export interface TrackRowProps extends React.HTMLAttributes<HTMLDivElement> {
    index: number;
    title: string;
    artist: string;
    duration: string;
    isActive?: boolean;
    track?: Track;
}

export const TrackRow = React.forwardRef<HTMLDivElement, TrackRowProps>(
    ({ className, index, title, artist, duration, isActive, track, onClick, ...props }, ref) => {
        // Library Store
        const { toggleLikeTrack, isTrackLiked } = useLibraryStore();
        const liked = track ? isTrackLiked(track.id) : false;

        const handleLike = (e: React.MouseEvent) => {
            e.stopPropagation(); // prevent playing track
            if (track) {
                toggleLikeTrack(track);
            }
        };

        return (
            <div
                ref={ref}
                onClick={onClick}
                className={cn(
                    "group flex flex-row items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors duration-200",
                    "hover:bg-white/5 cursor-pointer",
                    isActive && "bg-white/10",
                    className
                )}
                {...props}
            >
                <div className="flex flex-row items-center gap-4 flex-1 overflow-hidden">
                    <div className="w-8 flex justify-center text-sm text-foreground/50 relative">
                        <span className={cn("group-hover:opacity-0 transition-opacity", isActive && "opacity-0")}>
                            {index}
                        </span>
                        <Play
                            className={cn(
                                "absolute inset-0 m-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                isActive && "opacity-100"
                            )}
                        />
                    </div>
                    <div className="flex flex-col min-w-0 pr-4">
                        <span className={cn("text-base font-medium truncate", isActive && "font-semibold text-white")}>
                            {cleanTitle(title)}
                        </span>
                        <span className="text-sm text-foreground/60 truncate">
                            {artist}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {track && (
                        <button
                            onClick={handleLike}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:scale-110 active:scale-95"
                        >
                            <Heart
                                className={cn(
                                    "w-4 h-4 transition-colors",
                                    liked ? "fill-purple-500 text-purple-500" : "text-foreground/40 hover:text-white"
                                )}
                            />
                        </button>
                    )}
                    <div className="text-sm text-foreground/50 font-mono tracking-tighter w-12 text-right">
                        {duration}
                    </div>
                </div>
            </div>
        );
    }
);
TrackRow.displayName = "TrackRow";
