import { ReactNode } from "react";

type Column = { label: string; className?: string };

type Props = {
  columns: Column[];
  rows: ReactNode[][];
  emptyMessage?: string;
};

export default function DataTable({ columns, rows, emptyMessage = "No data yet." }: Props) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[720px] w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid #E8E4D9" }}>
            {columns.map((col) => (
              <th
                key={col.label}
                className={`text-left px-3 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wide ${col.className ?? ""}`}
                style={{ color: "#7C817A" }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 sm:px-5 py-8 text-sm text-center" style={{ color: "#7C817A" }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((cells, i) => (
              <tr
                key={i}
                className="transition hover:bg-gray-50"
                style={{ borderBottom: i < rows.length - 1 ? "1px solid #F0EDE6" : "none" }}
              >
                {cells.map((cell, j) => (
                  <td key={j} className="px-3 sm:px-5 py-3" style={{ color: "#24332B" }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
