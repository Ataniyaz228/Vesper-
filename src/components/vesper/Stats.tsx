import React from "react";
import { Activity } from "lucide-react";
import { AURA_DATA, T, Rise, Label, Card, RollNum } from "@/components/vesper/Shared";

export function Stats({ data }: { data: typeof AURA_DATA.stats }) {
    return (
        <section className="px-5 md:px-12 py-24 max-w-[1500px] mx-auto">
            <Rise className="flex items-end justify-between mb-12">
                <div>
                    <Label><Activity className="w-3 h-3" /> Telemetry</Label>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-4" style={{ color: T.text }}>By the numbers</h2>
                </div>
            </Rise>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {data.map((s, i) => (
                    <Rise key={s.id} delay={0.08 * i}>
                        <Card className="p-7 h-[200px] md:h-[220px] flex flex-col justify-between group cursor-default">
                            {/* Top label */}
                            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: T.sub }}>
                                {String(i + 1).padStart(2, "0")} · {s.label}
                            </span>

                            {/* Value */}
                            <div>
                                <div className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-1.5" style={{ color: T.text }}>
                                    <RollNum to={s.value} unit={s.unit} />
                                </div>
                                <p className="text-sm" style={{ color: T.sub }}>{s.sub}</p>
                            </div>

                            {/* Hover glow */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[24px]"
                                style={{ background: "radial-gradient(circle at 70% 90%, rgba(255,255,255,0.04) 0%, transparent 65%)" }}
                            />
                        </Card>
                    </Rise>
                ))}
            </div>
        </section>
    );
}
