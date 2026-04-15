"use client";

import { projects } from "@/lib/data";

export default function Ticker() {
  const items = [...projects, ...projects];

  return (
    <div className="border-b border-card-border bg-background/60 backdrop-blur-sm overflow-hidden">
      <div className="animate-marquee flex whitespace-nowrap py-1.5">
        {items.map((p, i) => (
          <span key={`${p.id}-${i}`} className="mx-4 inline-flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground/80">{p.title}</span>
            <span className="tabular-nums text-foreground/60">{p.price.toFixed(2)} VALU</span>
            <span className={p.changePercent >= 0 ? "text-gain" : "text-loss"}>
              {p.changePercent >= 0 ? "+" : ""}
              {p.changePercent.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
