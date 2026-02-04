import type { TodayItem } from "../../../shared/domain/types";

export function FocusPickDialog(props: {
  pickOpen: boolean;
  pickTop: number;
  onClosePick: () => void;

  waiting: TodayItem[];
  current: TodayItem | null;

  onPickChallenge: (id: number) => void;
}) {
  if (!props.pickOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={props.onClosePick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.55)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          top: props.pickTop,
          borderRadius: 18,
          border: "1px solid var(--lt-border)",
          background: "var(--lt-card)",
          padding: 14,
          maxHeight: `calc(100vh - ${props.pickTop}px - 120px)`,
          overflow: "auto",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Выбери фокус</div>

        {props.waiting
          .filter((x) => x.challenge_id !== props.current?.challenge_id)
          .map((x) => (
            <button
              key={x.challenge_id}
              onClick={() => props.onPickChallenge(x.challenge_id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 10px",
                borderRadius: 14,
                border: "1px solid var(--lt-border)",
                background: "var(--lt-card2)",
                color: "var(--lt-text)",
                cursor: "pointer",
                marginBottom: 8,
              }}
            >
              {x.title}
            </button>
          ))}

        <button
          onClick={props.onClosePick}
          style={{
            width: "100%",
            marginTop: 6,
            padding: "12px 12px",
            borderRadius: 14,
            border: "1px solid var(--lt-border)",
            background: "transparent",
            color: "var(--lt-text)",
            cursor: "pointer",
          }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
