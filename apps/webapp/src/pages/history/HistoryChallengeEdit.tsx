import type { HistoryDayDetailItemDto } from "./dto";

export function HistoryChallengeEdit(props: {
  it: HistoryDayDetailItemDto;
  dateLabel: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { it, dateLabel, onCancel, onSave } = props;

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{it.title}</div>
        <div style={{ fontSize: 12, opacity: 0.75, whiteSpace: "nowrap" }}>
          Редактирование: {dateLabel}
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
        (Скелет) Тут будут статус / минуты / комментарий.
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            border: "1px solid rgba(0,0,0,0.10)",
            background: "transparent",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Отмена
        </button>

        <button
          type="button"
          onClick={onSave}
          style={{
            border: "1px solid rgba(0,0,0,0.18)",
            background: "rgba(0,0,0,0.06)",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}
