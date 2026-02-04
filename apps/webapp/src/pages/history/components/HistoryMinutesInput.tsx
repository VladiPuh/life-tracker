export function HistoryMinutesInput(props: {
  disabled: boolean;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const { disabled, value, onChange } = props;

  return (
    <>
      <div style={{ fontSize: 12, opacity: 0.8 }}>Минуты</div>
      <input
        disabled={disabled}
        value={value ?? ""}
        inputMode="numeric"
        placeholder="пусто = нет факта"
        onChange={(e) => {
          const v = e.target.value.trim();
          if (v === "") return onChange(null);
          const n = Number(v);
          if (!Number.isFinite(n)) return;
          onChange(Math.max(0, Math.floor(n)));
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
          opacity: disabled ? 0.7 : 1,
        }}
      />
    </>
  );
}
