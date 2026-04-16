"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface SparklineChartProps {
  data: number[];
  positive: boolean;
}

export default function SparklineChart({ data, positive }: SparklineChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = data.map((value) => ({ value }));

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.6 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-[40px] min-w-0 w-full origin-left"
    >
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
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
        <div className="h-full w-full" />
      )}
    </motion.div>
  );
}
