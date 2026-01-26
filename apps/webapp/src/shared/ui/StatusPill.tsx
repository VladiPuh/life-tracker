import type { StatusView } from "../domain/types";

export function StatusPill({ s }: { s: StatusView }) {
  const label =
    s === "WAITING" ? "В ожидании" :
    s === "MIN" ? "MIN" :
    s === "BONUS" ? "BONUS" :
    s === "SKIP" ? "SKIP" : "FAIL";

  return (
    <span style={{
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid #ccc",
      fontSize: 12
    }}>
      {label}
    </span>
  );
}
