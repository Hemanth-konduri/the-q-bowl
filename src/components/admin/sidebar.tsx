"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarDays,
  UtensilsCrossed,
  List,
  Tag,
  Users,
  Truck,
  MapPin,
  IndianRupee,
  Ticket,
  Bell,
  Settings,
} from "lucide-react";

const nav = [
  {
    group: null,
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    group: "ORDERS",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: CalendarDays },
    ],
  },
  {
    group: "MENU",
    items: [
      { label: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
      { label: "Food Items", href: "/admin/food-items", icon: List },
      { label: "Categories", href: "/admin/categories", icon: Tag },
    ],
  },
  {
    group: "CUSTOMERS",
    items: [{ label: "Customers", href: "/admin/customers", icon: Users }],
  },
  {
    group: "DELIVERY",
    items: [
      { label: "Deliveries", href: "/admin/delivery", icon: Truck },
      { label: "Delivery Areas", href: "/admin/delivery-areas", icon: MapPin },
    ],
  },
  {
    group: "FINANCE",
    items: [
      { label: "Payments", href: "/admin/payments", icon: IndianRupee },
      { label: "Offers", href: "/admin/offers", icon: Ticket },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const mobileItems = nav.flatMap((section) => section.items);

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen w-56 hidden lg:flex flex-col border-r z-30" style={{ background: "#fff", borderColor: "#E8E4D9" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b shrink-0" style={{ borderColor: "#E8E4D9" }}>
          <Image src="/the_q_bowl_logo.png" alt="Q Bowl" width={28} height={28} className="rounded-md" />
          <span className="font-bold text-base tracking-tight" style={{ color: "#24332B" }}>Q Bowl</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {nav.map((section, i) => (
            <div key={i} className={i > 0 ? "mt-4" : ""}>
              {section.group && (
                <p className="px-2 mb-1 text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#7C817A" }}>
                  {section.group}
                </p>
              )}
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5"
                    style={{
                      background: active ? "#EDF2EE" : "transparent",
                      color: active ? "#496A5A" : "#4B5563",
                    }}
                  >
                    <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 backdrop-blur lg:hidden" style={{ borderColor: "#E8E4D9" }}>
        <div className="flex overflow-x-auto px-1 py-1.5">
          {mobileItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="min-w-16 flex-1 flex flex-col items-center justify-center rounded-lg px-2 py-1.5 text-[10px] font-medium"
                style={{
                  background: active ? "#EDF2EE" : "transparent",
                  color: active ? "#496A5A" : "#4B5563",
                }}
              >
                <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                <span className="mt-1 whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
