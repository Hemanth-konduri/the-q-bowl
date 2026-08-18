import { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  valueColor?: string;
};

export default function StatRow({ icon: Icon, iconBg, iconColor, label, value, valueColor = "#24332B" }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={13} color={iconColor} />
        </div>
        <span className="text-sm" style={{ color: "#4B5563" }}>{label}</span>
      </div>
      <span className="text-sm font-bold" style={{ color: valueColor }}>{value}</span>
    </div>
  );
}
