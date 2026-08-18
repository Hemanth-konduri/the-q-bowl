import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: "primary" | "outline";
};

export default function ActionButton({ href, onClick, children, variant = "outline" }: Props) {
  const styles =
    variant === "primary"
      ? { background: "#496A5A", color: "#fff", border: "none" }
      : { background: "#fff", color: "#24332B", borderColor: "#DDD9CC" };

  const cls = `inline-flex w-full sm:w-auto justify-center px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-90 ${variant === "outline" ? "border" : ""}`;

  if (href) return <Link href={href} className={cls} style={styles}>{children}</Link>;
  return <button onClick={onClick} className={cls} style={styles}>{children}</button>;
}
