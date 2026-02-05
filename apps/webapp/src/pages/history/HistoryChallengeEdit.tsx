import { useEffect, useState } from "react";
import type { HistoryDayDetailItemDto } from "./dto";
import { useHistoryEditDraft } from "./useHistoryEditDraft";
import { HistoryEditActions } from "./components/HistoryEditActions";
import { HistoryEditHeader } from "./components/HistoryEditHeader";
import { HistoryStatusPicker } from "./components/HistoryStatusPicker";
import { HistoryMinutesInput } from "./components/HistoryMinutesInput";
import { HistoryCommentInput } from "./components/HistoryCommentInput";
import { HistoryEditCard } from "./components/HistoryEditCard";

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
      <HistoryEditHeader title={it.title} dateLabel={dateLabel} />

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Статус</div>

        <HistoryStatusPicker
          value={draft.status_view}
          disabled={saving}
          onChange={(s) => setDraft({ ...draft, status_view: s })}
        />

        <HistoryMinutesInput
          disabled={saving}
          value={draft.minutes_fact}
          onChange={(v) => setDraft({ ...draft, minutes_fact: v })}
        />

        <HistoryCommentInput
          disabled={saving}
          value={draft.comment}
          commentRequired={commentRequired}
          onChange={(v) => setDraft({ ...draft, comment: v })}
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

      <HistoryEditActions
        saving={saving}
        dirty={dirty}
        commentRequired={commentRequired}
        commentOk={commentOk}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  );
}
