"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
    { name: "Home", href: "/", icon: Home },
    { name: "Discover", href: "/discover", icon: Compass },
    { name: "Library", href: "/library", icon: Library },
    { name: "Vesper", href: "/vesper", icon: Sparkles },
];

export function MobileNav() {
    const pathname = usePathname();
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-950/95 backdrop-blur-2xl border-t border-white/[0.06]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="flex items-center justify-around h-16 px-2">
                {NAV.map(({ name, href, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link key={href} href={href}
                            className={cn(
                                "flex flex-col items-center gap-1 flex-1 py-2 transition-colors",
                                active ? "text-white" : "text-white/30"
                            )}>
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
