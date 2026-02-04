type Status = "MIN" | "BONUS" | "SKIP" | "FAIL";

export function HistoryStatusPicker(props: {
  value: Status;
  disabled: boolean;
  onChange: (s: Status) => void;
}) {
  const { value, disabled, onChange } = props;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {(["MIN", "BONUS", "SKIP", "FAIL"] as const).map((s) => {
        const active = value === s;

        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
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
              transition:
                "transform 120ms ease, background 120ms ease, border-color 120ms ease",

              cursor: disabled ? "default" : "pointer",
              opacity: disabled ? 0.7 : 1,
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
