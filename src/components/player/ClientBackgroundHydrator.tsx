"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";

// This is a tiny invisible component strictly responsible for passing
// the Zustand currentTrack image URL into the AmbientBackground component.
// We keep it separate from the root layout so we don't force 'app/layout.tsx'
// to become a "use client" component.
import { AmbientBackground } from "@/components/ui/AmbientBackground";

export function ClientBackgroundHydrator() {
    const currentTrack = usePlayerStore((s) => s.currentTrack);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) return <AmbientBackground imageUrl={undefined} title={undefined} />;

    return <AmbientBackground imageUrl={currentTrack?.albumImageUrl} title={currentTrack?.title} />;
}
