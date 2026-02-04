export function StatusButton(props: {
  title: string;
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      title={props.title}
      aria-label={props.title}
      onClick={props.onClick}
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        border: "1px solid var(--lt-border)",
        background: "var(--lt-card2)",
        color: "var(--lt-text)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 88,
        height: 74,
        gap: 4,
      }}
    >
      <div style={{ fontSize: 26, lineHeight: 1 }}>{props.icon}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{props.label}</div>
    </button>
  );
}
