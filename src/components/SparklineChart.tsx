"use client";

import { useState, useLayoutEffect, useRef } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface SparklineChartProps {
  data: number[];
  positive: boolean;
}

export default function SparklineChart({ data, positive }: SparklineChartProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const w = Math.floor(r.width);
      const h = Math.floor(r.height);
      if (w > 0 && h > 0) setDims({ w, h });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    const id = requestAnimationFrame(read);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, []);

  const chartData = data.map((value) => ({ value }));

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.6 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-[40px] min-h-[40px] min-w-0 w-full max-w-full origin-left overflow-hidden"
    >
      <div ref={measureRef} className="h-full min-h-[40px] w-full min-w-0">
        {dims ? (
          <ResponsiveContainer width={dims.w} height={dims.h} minWidth={0} minHeight={1}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={positive ? "var(--green)" : "var(--red)"}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full min-h-[40px]" aria-hidden />
        )}
      </div>
    </motion.div>
  );
}
