import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  onClick?: () => void;
};

export function TodayCard(props: Props) {
  const isClickable = Boolean(props.onClick);

  return (
    <section
      onClick={props.onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isClickable) return;
        if (e.key === "Enter" || e.key === " ") props.onClick?.();
      }}
      style={{
        padding: 14,
        border: "1px solid var(--lt-border)",
        borderRadius: 14,
        background: "var(--lt-card)",
        marginBottom: 12,

        cursor: isClickable ? "pointer" : "default",
        userSelect: isClickable ? "none" : "auto",
      }}
    >
      {props.title && (
        <div style={{ fontWeight: 700, marginBottom: 10 }}>{props.title}</div>
      )}

      {props.children}
    </section>
  );
}
