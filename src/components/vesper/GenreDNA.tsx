import React from "react";
import { motion } from "framer-motion";
import { AURA_DATA, T, Rise, Card, Label, Sep } from "@/components/vesper/Shared";

export function GenreDNA({ genres }: { genres: typeof AURA_DATA.genres }) {
    return (
        <section className="px-5 md:px-12 pb-24 max-w-[1500px] mx-auto">
            <Rise>
                <Card className="p-8 md:p-10">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <Label>Sonic Identity</Label>
                            <h3 className="text-2xl font-black tracking-tight mt-4" style={{ color: T.text }}>Genre DNA</h3>
                        </div>
                    </div>
                    <Sep className="mb-8" />

                    <div className="flex flex-col gap-6">
                        {genres.map((g, i) => (
                            <div key={g.name} className="flex items-center gap-4">
                                <span className="w-5 text-xs font-mono text-right shrink-0" style={{ color: T.dim }}>
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="w-40 md:w-56 text-sm font-medium shrink-0 truncate" style={{ color: T.text }}>
                                    {g.name}
                                </span>
                                <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: T.dim }}>
                                    <motion.div className="h-full rounded-full"
                                        style={{ background: T.text }}
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${g.pct}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.2, delay: 0.08 * i, ease: "easeOut" }}
                                    />
                                </div>
                                <span className="w-8 text-right text-xs font-mono shrink-0" style={{ color: T.sub }}>
                                    {g.pct}%
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </Rise>
        </section>
    );
}
