import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

type Trend = { value: string; up: boolean } | null;

type Props = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  trend?: Trend;
  sub?: string;
  urgent?: boolean;
};

export default function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend, sub, urgent }: Props) {
  return (
    <div
      className="rounded-xl p-4 border bg-white"
      style={{ borderColor: urgent ? "#D86F45" : "#E8E4D9" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium" style={{ color: "#7C817A" }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={15} color={iconColor} />
        </div>
      </div>
      <p className="text-2xl font-bold mb-1" style={{ color: "#24332B" }}>{value}</p>
      {trend !== undefined ? (
        trend ? (
          <div className="flex items-center gap-1">
            {trend.up ? <TrendingUp size={12} color="#16A34A" /> : <TrendingDown size={12} color="#DC2626" />}
            <span className="text-xs font-medium" style={{ color: trend.up ? "#16A34A" : "#DC2626" }}>
              {trend.value}% vs yesterday
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Minus size={12} color="#7C817A" />
            <span className="text-xs" style={{ color: "#7C817A" }}>No data yesterday</span>
          </div>
        )
      ) : (
        <p className="text-xs" style={{ color: urgent ? "#D86F45" : "#7C817A" }}>{sub}</p>
      )}
    </div>
  );
}
