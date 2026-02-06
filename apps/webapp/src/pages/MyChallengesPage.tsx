type ChallengeType = "DO" | "NO_DO";

function CardRow(props: { title: string; subtitle: string; onClick?: () => void }) {
  return (
    <div
      onClick={props.onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") props.onClick?.();
      }}
      style={{
        padding: 16,
        borderRadius: 18,
        border: "1px solid var(--lt-border)",
        background: "var(--lt-card)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div style={{ fontWeight: 950, fontSize: 18, color: "var(--lt-text)" }}>{props.title}</div>
      <div style={{ marginTop: 6, opacity: 0.75, lineHeight: 1.3, color: "var(--lt-text)" }}>
        {props.subtitle}
      </div>
    </div>
  );
}

export default function MyChallengesPage(props: { onOpenType?: (t: ChallengeType) => void }) {
  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto", fontFamily: "system-ui, Arial" }}>
      <div style={{ fontSize: 20, fontWeight: 950, marginBottom: 10, color: "var(--lt-text)" }}>
        Мои челленджи
      </div>

      <div style={{ opacity: 0.7, lineHeight: 1.35, marginBottom: 14, color: "var(--lt-hint)" }}>
        Выбери раздел.
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <CardRow
          title="Активные"
          subtitle="Челленджи, где важно действие"
          onClick={() => props.onOpenType?.("DO")}
        />
        <CardRow
          title="Постоянные"
          subtitle="Норма по умолчанию (не делаю)"
          onClick={() => props.onOpenType?.("NO_DO")}
        />
      </div>
    </div>
  );
}
