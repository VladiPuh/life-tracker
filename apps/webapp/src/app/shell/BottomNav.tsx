// LT-SOURCE: AUTO 2026-02-01 03:03
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
  const Item = (p: {
    id: TabId;
    label: string;
    emphasize?: boolean;
    onClick: () => void;
  }) => {
    const isActive = props.active === p.id;

    return (
      <button
        onClick={p.onClick}
        style={{
          flex: 1,
          padding: "10px 6px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          opacity: isActive ? 1 : 0.6,
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
      <Item id="insights" label="Инсайты" onClick={() => props.onGo("insights")} />
      <Item id="history" label="История" onClick={() => props.onGo("history")} />
      <Item id="today" label="Сегодня" emphasize onClick={() => props.onGo("today")} />
      <Item id="new" label="Новый" emphasize onClick={() => props.onGo("new")} />
      <Item id="templates" label="Шаблоны" onClick={() => props.onGo("templates")} />
      <Item id="profile" label="Профиль" onClick={() => props.onGo("profile")} />
    </div>
  );
}
