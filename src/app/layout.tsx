import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { GlobalAudioPlayer } from "@/components/player/GlobalAudioPlayer";
import { FullScreenPlayer } from "@/components/player/FullScreenPlayer";
import { HiddenYouTubePlayer } from "@/components/player/HiddenYouTubePlayer";
import { Sidebar } from "@/components/layout/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/layout/PageTransition";
import { MagneticCursor } from "@/components/ui/MagneticCursor";
import { MobileNav } from "@/components/layout/MobileNav";
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vesper | Spatial Edge Streaming",
  description: "A premium experimental music streaming client.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen selection:bg-white/30 selection:text-white bg-zinc-950 text-white/90 overflow-hidden font-sans">

        {/* Global YouTube Player instance (hidden) */}
        <HiddenYouTubePlayer />

        {/* Layer 2: Main Layout Grid */}
        <div className="flex h-screen w-full relative z-10 overflow-hidden">

          {/* Glassmorphism Floating Sidebar */}
          <Sidebar />

          {/* Layer 3: Main Scrollable Content Area */}
          <main className="flex-1 h-[calc(100vh-3rem)] my-6 mr-6 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-40 relative z-10 scroll-smooth rounded-[40px]">
            <div className="max-w-7xl mx-auto w-full h-full relative">
              <ErrorBoundary>
                <PageTransition>
                  {children}
                </PageTransition>
              </ErrorBoundary>
            </div>
          </main>
        </div>

        {/* Layer 4: Floating Pill Player overlay */}
        <GlobalAudioPlayer />

        {/* Layer 5: Immersive Full Screen Player overlay */}
        <FullScreenPlayer />
        <MobileNav />

        <div className="hidden md:block"><MagneticCursor /></div>
      </body>

    </html>
  );
}
