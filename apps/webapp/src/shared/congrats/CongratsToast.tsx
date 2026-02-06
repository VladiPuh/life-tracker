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
        inset: 0,
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:
          "calc(var(--app-pad) + var(--safe-top)) var(--app-pad) calc(var(--app-pad) + var(--safe-bottom))",
        boxSizing: "border-box",
        background: "rgba(0,0,0,0.25)", // лёгкое затемнение, тихо
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 20,
          background: "var(--lt-card)",
          border: "1.5px solid rgba(76, 175, 80, 0.45)", // неброский зелёный
          color: "var(--lt-text)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.28)",
          padding: 20,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 17,
            letterSpacing: -0.3,
            marginBottom: 10,
          }}
        >
          {props.title}
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.45,
            opacity: 0.95,
            marginBottom: 16,
          }}
        >
          {props.text}
        </div>

        <button
          onClick={props.onClose}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 14,
            border: "1px solid rgba(76, 175, 80, 0.6)",
            background: "rgba(76, 175, 80, 0.18)", // зелёный, но спокойный
            color: "var(--lt-text)",
            fontSize: 15,
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
