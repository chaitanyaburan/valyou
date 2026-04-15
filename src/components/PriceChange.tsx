interface PriceChangeProps {
  value: number;
  percent: number;
}

export default function PriceChange({ value, percent }: PriceChangeProps) {
  const isPositive = value >= 0;
  const color = isPositive ? "text-gain" : "text-loss";
  const arrow = isPositive ? "▲" : "▼";

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${color}`}>
      <span className="text-[10px]">{arrow}</span>
      {isPositive ? "+" : ""}
      {value.toFixed(2)} ({isPositive ? "+" : ""}
      {percent.toFixed(2)}%)
    </span>
  );
}
