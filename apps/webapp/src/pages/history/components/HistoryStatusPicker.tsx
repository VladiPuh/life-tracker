type Status = "MIN" | "BONUS" | "SKIP" | "FAIL";

const STATUS_META: Record<
  Status,
  { emoji: string; label: string }
> = {
  MIN: { emoji: "🙂", label: "MIN" },
  BONUS: { emoji: "🔥", label: "BONUS" },
  SKIP: { emoji: "⏸️", label: "SKIP" },
  FAIL: { emoji: "❌", label: "FAIL" },
};

export function HistoryStatusPicker(props: {
  value: Status;
  disabled: boolean;
  onChange: (s: Status) => void;
}) {
  const { value, disabled, onChange } = props;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "nowrap", // ⬅ строго один ряд
        overflowX: "auto",
      }}
    >
      {(Object.keys(STATUS_META) as Status[]).map((s) => {
        const active = value === s;
        const meta = STATUS_META[s];

        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            aria-label={meta.label}
            title={meta.label}
            style={{
              flex: "0 0 auto",

              border: active
                ? "1px solid rgba(255,255,255,0.35)"
                : "1px solid rgba(255,255,255,0.12)",

              background: active
                ? "rgba(255,255,255,0.22)"
                : "rgba(255,255,255,0.06)",

              color: "#fff",

              borderRadius: 12,
              width: 44,
              height: 36,

              fontSize: 18,
              lineHeight: "36px",
              textAlign: "center",

              transform: active ? "scale(1.06)" : "scale(1)",
              transition:
                "transform 120ms ease, background 120ms ease, border-color 120ms ease",

              cursor: disabled ? "default" : "pointer",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {meta.emoji}
          </button>
        );
      })}
    </div>
  );
}
