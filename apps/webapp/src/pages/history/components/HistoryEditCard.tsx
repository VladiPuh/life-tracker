import type { ReactNode } from "react";

export function HistoryEditCard(props: { children: ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: 12,
        background: "rgba(0,0,0,0.18)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {props.children}
    </div>
  );
}
