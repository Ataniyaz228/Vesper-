import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

interface AlbumCardProps {
    title: string;
    artist: string;
    imageUrl: string;
    onClick?: () => void;
    className?: string;
}

export const AlbumCard = ({ title, artist, imageUrl, onClick, className }: AlbumCardProps) => {
    return (
        <Card
            onClick={onClick}
            variant="glass"
            className={cn(
                "group p-3 cursor-pointer hover:bg-glass-surface/60 transition-all duration-300",
                className
            )}
        >
            <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 shadow-md bg-black/10">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
                    sizes="(max-width: 768px) 50vw, 25vw"
                />

                {/* Hover Play Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                        <Play className="w-6 h-6 text-white ml-1 fill-current" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col px-1">
                <h3 className="font-semibold text-base truncate text-foreground/90">{title}</h3>
                <p className="text-sm text-foreground/50 truncate mt-0.5">{artist}</p>
            </div>
        </Card>
    );
};
