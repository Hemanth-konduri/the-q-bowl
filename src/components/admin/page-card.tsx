import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
};

export default function PageCard({ children, className = "", noPadding }: Props) {
  return (
    <div
      className={`rounded-xl border bg-white ${noPadding ? "" : "p-5"} ${className}`}
      style={{ borderColor: "#E8E4D9" }}
    >
      {children}
    </div>
  );
}
