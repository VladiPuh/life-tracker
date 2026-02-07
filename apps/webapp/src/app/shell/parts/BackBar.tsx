export function BackBar(props: {
  show: boolean;
  showBottomUI: boolean;
  onBack: () => void;
  label?: string;
  buildLabel?: string | null;
  bottomOpacity: number;
  bottomPE: "auto" | "none";
  bottomTransform: string;
  disableBottomUIAnim: boolean;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        paddingLeft: "var(--app-pad)",
        paddingRight: "var(--app-pad)",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 20,
        maxHeight: props.show && props.showBottomUI ? 140 : 0,
        overflow: "hidden",
        paddingBottom: props.show && props.showBottomUI ? 8 : 0,
        opacity: props.show ? props.bottomOpacity : 0,
        pointerEvents: props.show ? props.bottomPE : "none",
        transition: props.disableBottomUIAnim ? "none" : "transform 180ms ease, opacity 120ms ease",
        willChange: props.disableBottomUIAnim ? "auto" : "transform",
        transform: props.bottomTransform,
      }}
    >
      {props.show ? (
        <>
          {props.buildLabel ? (
            <div
              style={{
                fontSize: 10,
                opacity: 0.4,
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              build: {props.buildLabel}
            </div>
          ) : null}

          <button
            onClick={props.onBack}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 14,
              border: "1px solid var(--lt-border)",
              background: "var(--lt-card)",
              color: "var(--lt-text)",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: -0.2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            aria-label="Назад"
            title="Назад"
          >
            <span style={{ opacity: 0.9 }}>←</span>
            <span>{props.label ?? "Назад"}</span>
          </button>
        </>
      ) : null}
    </div>
  );
}
