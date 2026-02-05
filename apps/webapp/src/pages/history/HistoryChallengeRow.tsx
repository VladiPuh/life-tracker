import type { HistoryDayDetailItemDto } from "./dto";

export function HistoryChallengeRow(props: {
  it: HistoryDayDetailItemDto;
  statusLabel: (s: unknown) => string;
  onEdit: () => void;
}) {
  const { it, statusLabel, onEdit } = props;

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div
          style={{
            fontSize: 15,          // ⬅ было 13
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -0.2,
            flex: 1,
            minWidth: 0,
            overflowWrap: "anywhere",
          }}
        >
          {it.title}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.8, whiteSpace: "nowrap" }}>
            {statusLabel(it.status_view)}
          </div>

          <button
            type="button"
            onClick={onEdit}
            style={{
              border: "1px solid rgba(0,0,0,0.10)",
              background: "transparent",
              borderRadius: 10,
              padding: "6px 10px",
              fontSize: 12,
              opacity: 0.85,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Изменить
          </button>
        </div>
      </div>

      {(it.minutes_fact != null || (it.comment ?? "").trim().length > 0) && (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8, lineHeight: 1.35 }}>
          {it.minutes_fact != null && <div>Минут: {it.minutes_fact}</div>}
          {(it.comment ?? "").trim().length > 0 && <div>Комментарий: {it.comment}</div>}
        </div>
      )}
    </div>
  );
}
