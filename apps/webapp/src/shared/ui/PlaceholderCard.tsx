export function PlaceholderCard(props: { title: string; text: string }) {
  return (
    <div
      style={{
        padding: 12,
        border: "1px solid var(--lt-border)",
        borderRadius: 12,
        marginTop: 12,
        background: "var(--lt-card)",
        color: "var(--lt-text)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{props.title}</div>
      <div style={{ opacity: 0.75, lineHeight: 1.35 }}>{props.text}</div>
    </div>
  );
}
