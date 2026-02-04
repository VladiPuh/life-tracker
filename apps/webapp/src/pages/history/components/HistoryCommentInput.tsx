export function HistoryCommentInput(props: {
  disabled: boolean;
  value: string | null;
  commentRequired: boolean;
  onChange: (v: string | null) => void;
}) {
  const { disabled, value, commentRequired, onChange } = props;

  return (
    <>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Комментарий{" "}
        {commentRequired ? (
          <span style={{ opacity: 0.75, fontSize: 12, marginLeft: 6 }}>
            Обязательно
          </span>
        ) : null}
      </div>

      <textarea
        disabled={disabled}
        value={value ?? ""}
        placeholder="пусто = без комментария"
        onChange={(e) => {
          const v = e.target.value;
          onChange(v.trim().length ? v : null);
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
          opacity: disabled ? 0.7 : 1,
        }}
      />
    </>
  );
}
