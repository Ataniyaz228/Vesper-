// Typography opacity tokens — 4 levels only
export const text = {
    primary: "text-white/90",   // headings, active nav items
    secondary: "text-white/50",   // subtitles, artist names
    muted: "text-white/25",   // meta, timestamps, eyebrows
    ghost: "text-white/10",   // watermark numbers, decorative
} as const;

// Backdrop blur tokens — 3 levels only
export const blur = {
    sm: "backdrop-blur-xl",    // cards, sidebar
    md: "backdrop-blur-2xl",   // overlays, player
    lg: "backdrop-blur-3xl",   // fullscreen modals
} as const;

// Border tokens
export const border = {
    subtle: "border border-white/[0.04]",
    default: "border border-white/[0.06]",
    strong: "border border-white/[0.10]",
} as const;
