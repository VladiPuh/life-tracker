import type { HistoryDayDetailItemDto } from "./dto";

const STATUS_EMOJI: Record<string, string> = {
  MIN: "✅",
  BONUS: "⭐",
  SKIP: "↩️",
  FAIL: "❌",
};

export function HistoryChallengeRow(props: {
  it: HistoryDayDetailItemDto;
  statusLabel: (s: unknown) => string; // оставляем, но больше не используем
  onEdit: () => void;
}) {
  const { it, onEdit } = props;

  const statusKey = String(it.status_view ?? "");
  const emoji = STATUS_EMOJI[statusKey] ?? "•";

  const comment = (it.comment ?? "").trim();
  const hasExtra = it.minutes_fact != null || comment.length > 0;

  return (
    <button
      type="button"
      onClick={onEdit}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "rgba(0,0,0,0.02)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center", // ✅ всё на одной линии
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 18,
            lineHeight: "18px",
            opacity: 0.9,
            flexShrink: 0,
            width: 22,
            textAlign: "center",
          }}
          aria-label={statusKey}
          title={statusKey}
        >
          {emoji}
        </div>

        <div
          style={{
            fontSize: 15,
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

        <div
          style={{
            marginLeft: "auto",
            fontSize: 18,
            opacity: 0.75,
            flexShrink: 0,
          }}
          aria-label="Изменить"
          title="Изменить"
        >
          ✏️
        </div>
      </div>

      {hasExtra && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            opacity: 0.8,
            lineHeight: 1.35,
            maxWidth: "100%",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            hyphens: "auto",
          }}
        >
          {it.minutes_fact != null && <div>Минут: {it.minutes_fact}</div>}
          {comment.length > 0 && <div>Комментарий: {comment}</div>}
        </div>
      )}
    </button>
  );
}
