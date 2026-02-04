export function HistoryEditActions(props: {
  saving: boolean;
  dirty: boolean;
  commentRequired: boolean;
  commentOk: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { saving, dirty, commentRequired, commentOk, onCancel, onSave } = props;

  return (
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
        onClick={onCancel}
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
        onClick={onSave}
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
          cursor:
            saving || !dirty || (commentRequired && !commentOk)
              ? "default"
              : "pointer",
        }}
      >
        {saving ? "Сохранение..." : "Сохранить"}
      </button>
    </div>
  );
}
