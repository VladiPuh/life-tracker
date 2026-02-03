import { useEffect, useState } from "react";
import type { HistoryDayDetailItemDto } from "./dto";
import { useHistoryEditDraft } from "./useHistoryEditDraft";

type Draft = {
  status_view: "MIN" | "BONUS" | "SKIP" | "FAIL";
  minutes_fact: number | null;
  comment: string | null;
};

export function HistoryChallengeEdit(props: {
  it: HistoryDayDetailItemDto;
  dateLabel: string;
  onCancel: () => void;
  // ✅ теперь onSave может быть sync или async
  onSave: (draft: Draft) => void | Promise<void>;
  errorText?: string | null;
}) {

  const { it, dateLabel, onCancel, onSave, errorText } = props;
  const { draft, setDraft, dirty, reset } = useHistoryEditDraft(it);
  const commentRequired = draft.status_view === "FAIL" || draft.status_view === "SKIP";
  const commentOk = !!(draft.comment && draft.comment.trim().length > 0);

  const [saving, setSaving] = useState(false);

  const handleCancel = () => {
    if (saving) return false;

    if (dirty) {
      const ok = window.confirm("Есть несохранённые изменения. Отменить?");
      if (!ok) return false;
    }

    reset();
    onCancel();
    return true;
  };

  useEffect(() => {
    // BackBar должен работать как "Отмена" (reset + close)
    (window as any).__LT_EDIT_CANCEL__ = () => handleCancel();

    return () => {
      if ((window as any).__LT_EDIT_CANCEL__) {
        delete (window as any).__LT_EDIT_CANCEL__;
      }
    };
  }, [dirty, reset, onCancel, saving]);

  async function handleSave() {
    if (saving) return;
    if (!dirty) return;
    setSaving(true);
    try {
      await Promise.resolve(onSave(draft));
      reset();
      onCancel();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        opacity: saving ? 0.85 : 1,
        pointerEvents: saving ? "none" : "auto", // ✅ жёсткая блокировка всего блока
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
                disabled={saving}
                onClick={() => setDraft({ ...draft, status_view: s })}
                style={{
                  border: active
                    ? "1px solid rgba(255,255,255,0.26)"
                    : "1px solid rgba(255,255,255,0.10)",

                  background: active
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(255,255,255,0.05)",

                  color: active ? "#ffffff" : "rgba(255,255,255,0.80)",

                  borderRadius: 999,
                  padding: "10px 12px",
                  minWidth: 64,
                  fontSize: 12,
                  fontWeight: active ? 800 : 600,

                  transform: active ? "scale(1.03)" : "scale(1)",
                  transition: "transform 120ms ease, background 120ms ease, border-color 120ms ease",

                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 12, opacity: 0.8 }}>Минуты</div>
        <input
          disabled={saving}
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
            boxSizing: "border-box",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "9px 11px",
            fontSize: 12,
            background: "rgba(255,255,255,0.06)",
            color: "#eaeaea",
            outline: "none",
            opacity: saving ? 0.7 : 1,
          }}
        />

        <div style={{ fontSize: 12, opacity: 0.8 }}>Комментарий{" "}
          {commentRequired ? (
            <span style={{ opacity: 0.75, fontSize: 12, marginLeft: 6 }}>Обязательно</span>
          ) : null}
        </div>
        
        <textarea
          disabled={saving}
          value={draft.comment ?? ""}
          placeholder="пусто = без комментария"
          onChange={(e) => {
            const v = e.target.value;
            setDraft({ ...draft, comment: v.trim().length ? v : null });
          }}
          rows={2}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "9px 11px",
            fontSize: 12,
            background: "rgba(255,255,255,0.06)",
            color: "#eaeaea",
            outline: "none",
            resize: "none",
            opacity: saving ? 0.7 : 1,
          }}
        />
      </div>

      {errorText && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            borderRadius: 10,
            background: "rgba(255,0,0,0.08)",
            color: "#c33",
            fontSize: 12,
          }}
        >
          {errorText}
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          marginBottom: 12,
          padding: 10,

          borderRadius: 14,
          background: "rgba(0,0,0,0.20)",
          border: "1px solid rgba(255,255,255,0.10)",

          display: "flex",
          gap: 10,
        }}
      >
        <button
          onClick={handleCancel}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "#eaeaea",
            fontSize: 13,
          }}
        >
          Отмена
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !dirty || (commentRequired && !commentOk)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.12)",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            opacity: saving || !dirty || (commentRequired && !commentOk) ? 0.55 : 1,
            cursor: saving || !dirty || (commentRequired && !commentOk) ? "default" : "pointer",
          }}
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
