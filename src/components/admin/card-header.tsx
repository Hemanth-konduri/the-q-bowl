import { ReactNode } from "react";

type Props = {
  title: string;
  right?: ReactNode;
};

export default function CardHeader({ title, right }: Props) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 border-b"
      style={{ borderColor: "#E8E4D9" }}
    >
      <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>{title}</h2>
      {right && <div>{right}</div>}
    </div>
  );
}
