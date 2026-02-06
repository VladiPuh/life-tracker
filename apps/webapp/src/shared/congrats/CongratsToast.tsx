export function CongratsToast(props: {
  title: string;
  text: string;
  onClose: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 900,
        display: "flex",
        justifyContent: "center",
        padding:
          "0 var(--app-pad) calc(var(--app-pad) + var(--safe-bottom) + var(--nav-h)) var(--app-pad)",
        boxSizing: "border-box",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 18,
          background: "var(--lt-card)",
          border: "1px solid var(--lt-border)",
          color: "var(--lt-text)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
          padding: 14,
          pointerEvents: "auto",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: -0.2, marginBottom: 6 }}>
          {props.title}
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.35, opacity: 0.9 }}>{props.text}</div>

        <button
          onClick={props.onClose}
          style={{
            width: "100%",
            marginTop: 10,
            height: 40,
            borderRadius: 14,
            border: "1px solid var(--lt-border)",
            background: "var(--lt-bg)",
            color: "var(--lt-text)",
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: -0.2,
            cursor: "pointer",
          }}
        >
          Ок
        </button>
      </div>
    </div>
  );
}
