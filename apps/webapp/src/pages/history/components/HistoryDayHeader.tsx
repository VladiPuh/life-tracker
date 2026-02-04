export function HistoryDayHeader(props: { dateLabel: string }) {
  return (
    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
      {props.dateLabel}
    </div>
  );
}
