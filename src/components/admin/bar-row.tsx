type Props = {
  label: string;
  value: number;
  max: number;
  meta?: string;
  color?: string;
};

export default function BarRow({ label, value, max, meta, color = "#496A5A" }: Props) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium" style={{ color: "#24332B" }}>{label}</span>
        <div className="flex items-center gap-3 text-xs" style={{ color: "#7C817A" }}>
          {meta && <span>{meta}</span>}
          <span className="font-semibold" style={{ color: "#24332B" }}>{value}</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F0F0EC" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
