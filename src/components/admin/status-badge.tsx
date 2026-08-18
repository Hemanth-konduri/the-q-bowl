const COLORS: Record<string, { bg: string; text: string }> = {
  // Order statuses
  PENDING:          { bg: "#FEF9C3", text: "#854D0E" },
  CONFIRMED:        { bg: "#DBEAFE", text: "#1E40AF" },
  PREPARING:        { bg: "#FEF3C7", text: "#92400E" },
  READY:            { bg: "#D1FAE5", text: "#065F46" },
  OUT_FOR_DELIVERY: { bg: "#EDE9FE", text: "#5B21B6" },
  DELIVERED:        { bg: "#DCFCE7", text: "#166534" },
  CANCELLED:        { bg: "#FEE2E2", text: "#991B1B" },
  FAILED:           { bg: "#FEE2E2", text: "#991B1B" },
  // Subscription statuses
  ACTIVE:           { bg: "#DCFCE7", text: "#166534" },
  PAUSED:           { bg: "#FEF9C3", text: "#854D0E" },
  COMPLETED:        { bg: "#DBEAFE", text: "#1E40AF" },
  // Payment statuses
  SUCCESS:          { bg: "#DCFCE7", text: "#166534" },
  REFUNDED:         { bg: "#EDE9FE", text: "#5B21B6" },
  PARTIALLY_REFUNDED: { bg: "#FEF3C7", text: "#92400E" },
  // Delivery statuses
  ASSIGNED:         { bg: "#DBEAFE", text: "#1E40AF" },
  PICKED_UP:        { bg: "#FEF3C7", text: "#92400E" },
};

type Props = { status: string };

export default function StatusBadge({ status }: Props) {
  const color = COLORS[status] ?? { bg: "#F3F4F6", text: "#374151" };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ background: color.bg, color: color.text }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
