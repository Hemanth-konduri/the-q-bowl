/**
 * Standard Order ID Formatter for The Q-Bowl
 * Ensures 100% consistent display across Customer Dashboard, Admin Console, and Delivery Partner App.
 *
 * Examples:
 * - "ord-1788847731564-631" -> "#QB-77315631" or "#ORD-77315631"
 * - Consistent 8-character uppercase identifier
 */

export function formatOrderId(orderId?: string | null): string {
  if (!orderId) return "#ORD-000000";
  
  // If it's standard ord-timestamp-rand format
  if (orderId.startsWith("ord-")) {
    const parts = orderId.split("-");
    if (parts.length >= 3) {
      const ts = parts[1]; // e.g. 1788847731564
      const rand = parts[2]; // e.g. 631
      const shortCode = `${ts.slice(-5)}${rand.slice(-3)}`.toUpperCase();
      return `#ORD-${shortCode}`;
    }
  }

  // If already prefixed with #
  const cleanId = orderId.replace(/^#/, "");
  
  // Clean alphanumeric suffix of 8 characters
  const suffix = cleanId.length > 8 ? cleanId.slice(-8) : cleanId;
  return `#ORD-${suffix.toUpperCase()}`;
}

export function formatShortOrderId(orderId?: string | null): string {
  if (!orderId) return "ORD-0000";
  return formatOrderId(orderId).replace(/^#/, "");
}
