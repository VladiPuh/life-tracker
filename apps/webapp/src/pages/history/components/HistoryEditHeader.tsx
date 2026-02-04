export function HistoryEditHeader(props: { title: string; dateLabel: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 800 }}>{props.title}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Редактирование: {props.dateLabel}
      </div>
    </div>
  );
}
