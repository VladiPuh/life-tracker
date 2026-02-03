import type { HistoryDayDetailItemDto } from "./dto";
import { useHistoryEditDraft } from "./useHistoryEditDraft";

export function HistoryChallengeEdit(props: {
  it: HistoryDayDetailItemDto;
  dateLabel: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { it, dateLabel, onCancel, onSave } = props;
  const { draft, setDraft, reset } = useHistoryEditDraft(it);

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

<div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
  <div style={{ fontSize: 12, opacity: 0.8 }}>Статус</div>
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {(["MIN", "BONUS", "SKIP", "FAIL"] as const).map((s) => {
      const active = draft.status_view === s;
      return (
        <button
          key={s}
          type="button"
          onClick={() => setDraft({ ...draft, status_view: s })}
          style={{
            border: active ? "1px solid rgba(0,0,0,0.22)" : "1px solid rgba(0,0,0,0.10)",
            background: active ? "rgba(0,0,0,0.07)" : "transparent",
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {s}
        </button>
      );
    })}
  </div>

  <div style={{ fontSize: 12, opacity: 0.8 }}>Минуты</div>
    <input
        value={draft.minutes_fact ?? ""}
        inputMode="numeric"
        placeholder="пусто = нет факта"
        onChange={(e) => {
        const v = e.target.value.trim();
        if (v === "") return setDraft({ ...draft, minutes_fact: null });
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        setDraft({ ...draft, minutes_fact: Math.max(0, Math.floor(n)) });
        }}
        style={{
        width: "100%",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 12,
        background: "rgba(255,255,255,0.6)",
        outline: "none",
        }}
    />

    <div style={{ fontSize: 12, opacity: 0.8 }}>Комментарий</div>
    <textarea
        value={draft.comment ?? ""}
        placeholder="пусто = без комментария"
        onChange={(e) => {
        const v = e.target.value;
        setDraft({ ...draft, comment: v.trim().length ? v : null });
        }}
        rows={3}
        style={{
        width: "100%",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 12,
        background: "rgba(255,255,255,0.6)",
        outline: "none",
        resize: "none",
        }}
    />
    </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={() => {
            reset();
            onCancel();
            }}
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
