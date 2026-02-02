import React from "react";

type Props = {
  title: string;
  children: React.ReactNode;

  bottomNav: React.ReactNode;
  buildLabel?: string | null;
  backBar?: {
    show: boolean;
    onBack: () => void;
    label?: string; // на будущее, если захочешь "Назад к..."
  };
};

export function AppShell({ title, children, bottomNav, buildLabel, backBar }: Props) {
  return (
    <div
      style={{
        maxWidth: 520,
        margin: "0 auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, Arial",
      }}
    >
      {/* TopBar */}
      <div
        style={{
          flexShrink: 0,
          paddingTop: "var(--safe-top)",
          height: "calc(var(--safe-top) + var(--topbar-h))",
          display: "flex",
          alignItems: "flex-end",
          paddingLeft: "var(--app-pad)",
          paddingRight: "var(--app-pad)",
          paddingBottom: 8,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: -0.2,
            color: "var(--lt-text)",
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>

      {/* ScrollArea */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingLeft: "var(--app-pad)",
          paddingRight: "var(--app-pad)",
          paddingTop: "calc(var(--app-pad) + var(--topbar-gap))",
          paddingBottom: backBar?.show
            ? "calc(var(--app-pad) + var(--nav-h) + var(--safe-bottom) + 52px)" // 44 кнопка + 8 gap
            : "calc(var(--app-pad) + var(--nav-h) + var(--safe-bottom))",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>

      {/* BackBar (outside scroll, above BottomNav) */}
      {backBar?.show ? (
        <div
          style={{
            flexShrink: 0,
            paddingLeft: "var(--app-pad)",
            paddingRight: "var(--app-pad)",
            paddingBottom: 8,
            boxSizing: "border-box",

            position: "relative",
            zIndex: 20,
            pointerEvents: "auto",
          }}
        >
          {buildLabel ? (
            <div
              style={{
                fontSize: 10,        // было 12 → стало меньше
                opacity: 0.4,
                textAlign: "center",
                marginBottom: 6,     // чуть выше кнопки
              }}
            >
              build: {buildLabel}
            </div>
          ) : null}
          
          <button
            onClick={backBar.onBack}
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
            <span>{backBar.label ?? "Назад"}</span>
          </button>
        </div>
      ) : null}

      <div style={{ position: "relative", zIndex: 10 }}>
        {bottomNav}
      </div>
    </div>
  );
}
