import { useEffect, useState } from "react";
import type { HistoryDayDetailItemDto } from "./dto";
import { useHistoryEditDraft } from "./useHistoryEditDraft";
import { HistoryEditActions } from "./components/HistoryEditActions";
import { HistoryEditHeader } from "./components/HistoryEditHeader";
import { HistoryMinutesInput } from "./components/HistoryMinutesInput";
import { HistoryCommentInput } from "./components/HistoryCommentInput";

type Draft = {
  status_view: "MIN" | "BONUS" | "SKIP" | "FAIL";
  minutes_fact: number | null;
  comment: string | null;
};

const COMMENT_MAX = 280;
const MINUTES_MAX_CHARS = 4;

type Status = Draft["status_view"];

const STATUS_EMOJI: Record<Status, string> = {
  MIN: "✅",
  BONUS: "⭐",
  SKIP: "↩️",
  FAIL: "❌",
};

export function HistoryChallengeEdit(props: {
  it: HistoryDayDetailItemDto;
  dateLabel: string;
  onCancel: () => void;
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
    (window as any).__LT_EDIT_CANCEL__ = () => handleCancel();
    return () => {
      delete (window as any).__LT_EDIT_CANCEL__;
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

  const setStatus = (s: Status) => {
    if (saving) return;
    setDraft({ ...draft, status_view: s });
  };

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        opacity: saving ? 0.85 : 1,
        pointerEvents: saving ? "none" : "auto",
      }}
    >
      <HistoryEditHeader title={it.title} dateLabel={dateLabel} />

      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.8 }}>Статус</div>

        {/* Статусы: эмодзи на всю ширину, без "блоков" */}
        <div style={{ display: "flex", gap: 10 }}>
          {(["MIN", "BONUS", "SKIP", "FAIL"] as const).map((s) => {
            const active = draft.status_view === s;
            return (
              <button
                key={s}
                type="button"
                disabled={saving}
                onClick={() => setStatus(s)}
                aria-label={s}
                title={s}
                style={{
                  flex: 1,
                  height: 40,
                  border: "none",
                  background: "transparent",
                  cursor: saving ? "default" : "pointer",
                  opacity: active ? 1 : 0.6,
                  transform: active ? "scale(1.08)" : "scale(1)",
                  transition: "transform 140ms ease, opacity 140ms ease",
                  fontSize: 20,
                  lineHeight: "40px",
                  textAlign: "center",
                  userSelect: "none",
                }}
              >
                {STATUS_EMOJI[s]}
              </button>
            );
          })}
        </div>

        <HistoryMinutesInput
          disabled={saving}
          value={draft.minutes_fact}
          onChange={(v) => {
            const raw = String(v ?? "");
            const trimmed = raw.slice(0, MINUTES_MAX_CHARS);
            const num = trimmed === "" ? null : Number(trimmed);
            setDraft({
              ...draft,
              minutes_fact: Number.isFinite(num) ? num : null,
            });
          }}
        />

        {/* Комментарий + счётчик внутри */}
        <div style={{ position: "relative" }}>
          <HistoryCommentInput
            disabled={saving}
            value={draft.comment}
            commentRequired={commentRequired}
            onChange={(v) =>
              setDraft({
                ...draft,
                comment: v ? v.slice(0, COMMENT_MAX) : v,
              })
            }
          />

          <div
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              fontSize: 11,
              opacity: 0.6,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {(draft.comment?.length ?? 0)}/{COMMENT_MAX}
          </div>
        </div>
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

      {/* Кнопки ближе к редактированию */}
      <div style={{ marginTop: 10 }}>
        <HistoryEditActions
          saving={saving}
          dirty={dirty}
          commentRequired={commentRequired}
          commentOk={commentOk}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
