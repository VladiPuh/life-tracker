// LT-SOURCE: AUTO 2026-02-01 03:03
import { useRef, useState } from "react";

export type TabId =
  | "insights"
  | "history"
  | "today"
  | "new"
  | "templates"
  | "profile";

export function BottomNav(props: {
  active: TabId;
  onGo: (tab: TabId) => void;
}) {
  const [pending, setPending] = useState<TabId | null>(null);
  const rafRef = useRef<number | null>(null);

  const go = (tab: TabId) => {
    if (props.active === tab) return;
    if (pending) return;

    setPending(tab);

    // микро-задержка: 2 rAF, без таймеров
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        props.onGo(tab);
        setPending(null);
      });
    });
  };

  const Item = (p: {
    id: TabId;
    label: string;
    emphasize?: boolean;
  }) => {
    const isActive = props.active === p.id;
    const isPending = pending === p.id;

    return (
      <button
        onClick={() => go(p.id)}
        style={{
          flex: 1,
          padding: "10px 6px",
          border: "none",
          background: "transparent",
          cursor: "pointer",

          opacity: isActive || isPending ? 1 : 0.6,
          transform: isPending ? "scale(0.96)" : "scale(1)",
          transition: "opacity 120ms ease, transform 120ms ease",

          fontWeight: p.emphasize ? 800 : 600,
          letterSpacing: p.emphasize ? -0.2 : 0,
          color: "var(--lt-text)",
        }}
        aria-label={p.label}
        title={p.label}
      >
        {p.label}
      </button>
    );
  };

  return (
    <div
      style={{
        flexShrink: 0,
        minHeight: "var(--nav-h)",
        paddingTop: 10,
        paddingBottom: "calc(10px + var(--safe-bottom))",
        background: "var(--lt-card)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--lt-border)",
        display: "flex",
        gap: 6,
        boxSizing: "border-box",
      }}
    >
      <Item id="insights" label="Инсайты" />
      <Item id="history" label="История" />
      <Item id="today" label="Сегодня" emphasize />
      <Item id="new" label="Новый" emphasize />
      <Item id="templates" label="Шаблоны" />
      <Item id="profile" label="Профиль" />
    </div>
  );
}
