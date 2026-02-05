import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  title: string;
  children: React.ReactNode;

  bottomNav: React.ReactNode;
  buildLabel?: string | null;
  backBar?: {
    show: boolean;
    onBack: () => void;
    label?: string;
  };
};

// No visualViewport: TG iOS WebView + vv = race conditions.
// Rule: hide BottomNav/BackBar on any focus, and show only after a short, controlled delay after blur.
// Delay is implemented via rAF (no setTimeout).
// NOTE: keep this small; too large makes navigation feel sluggish.
const SHOW_AFTER_BLUR_MS = 220;

export function AppShell({ title, children, bottomNav, buildLabel, backBar }: Props) {
  const [isInputActive, setIsInputActive] = useState(false);
  const [isPostBlurHold, setIsPostBlurHold] = useState(false);

  const holdSeqRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const cancelHold = () => {
    holdSeqRef.current += 1;
    setIsPostBlurHold(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startHold = () => {
    const seq = (holdSeqRef.current += 1);
    setIsPostBlurHold(true);

    const t0 = performance.now();

    const tick = () => {
      if (holdSeqRef.current != seq) return;
      const dt = performance.now() - t0;
      if (dt >= SHOW_AFTER_BLUR_MS) {
        setIsPostBlurHold(false);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const isFormEl = (el: Element | null) => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if (node.isContentEditable) return true;
      return false;
    };

    const sync = () => {
      const active = isFormEl(document.activeElement);
      setIsInputActive(active);
      if (active) {
        cancelHold();
      }
    };

    const onFocusIn = () => {
      sync();
    };

    const onFocusOut = () => {
      // wait 1 frame to let focus move to another input without flicker
      requestAnimationFrame(() => {
        const active = isFormEl(document.activeElement);
        setIsInputActive(active);

        if (!active) startHold();
        else cancelHold();
      });
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    sync();
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      cancelHold();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showBottomUI = useMemo(() => {
    return !isInputActive && !isPostBlurHold;
  }, [isInputActive, isPostBlurHold]);
  const disableBottomUIAnim = isInputActive;

  // IMPORTANT: When keyboard is open, do NOT reserve space for BottomNav/BackBar.
  // On iOS Telegram WebView this reserved padding frequently becomes a "phantom" opaque block
  // attached to the keyboard.
  const scrollPadBottom = useMemo(() => {
    if (!showBottomUI) return "calc(var(--app-pad) + var(--safe-bottom))";

    return backBar?.show
      ? "calc(var(--app-pad) + var(--nav-h) + var(--safe-bottom) + 52px)"
      : "calc(var(--app-pad) + var(--nav-h) + var(--safe-bottom))";
  }, [showBottomUI, backBar?.show]);

  const bottomOpacity = showBottomUI ? 1 : 0;
  const bottomPE = showBottomUI ? ("auto" as const) : ("none" as const);

  const bottomTransform = showBottomUI ? "translateY(0)" : "translateY(18px)";

  return (
    <div
      style={{
        maxWidth: 520,
        width: "100%",
        margin: "0 auto",
        height: "var(--tg-vh, 100dvh)",
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
          overflowX: "hidden",
          overscrollBehaviorY: "contain",
          paddingLeft: "var(--app-pad)",
          paddingRight: "var(--app-pad)",
          paddingTop: "calc(var(--app-pad) + var(--topbar-gap))",
          paddingBottom: scrollPadBottom,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>

      {/* BackBar — НЕ размонтируем */}
      <div
        style={{
          flexShrink: 0,
          paddingLeft: "var(--app-pad)",
          paddingRight: "var(--app-pad)",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 20,

          // ✅ collapse: когда скрываем — не занимаем высоту
          maxHeight: backBar?.show && showBottomUI ? 140 : 0,
          overflow: "hidden",
          paddingBottom: backBar?.show && showBottomUI ? 8 : 0,

          opacity: backBar?.show ? bottomOpacity : 0,
          pointerEvents: backBar?.show ? bottomPE : "none",
          transition: disableBottomUIAnim ? "none" : "transform 180ms ease, opacity 120ms ease",
          willChange: disableBottomUIAnim ? "auto" : "transform",
          transform: bottomTransform,
        }}
      >
        {backBar?.show ? (
          <>
            {buildLabel ? (
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.4,
                  textAlign: "center",
                  marginBottom: 6,
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
          </>
        ) : null}
      </div>

      {/* BottomNav — НЕ размонтируем */}
      <div
        style={{
          position: "relative",
          zIndex: 10,

          // ✅ collapse: когда скрываем — не занимаем высоту (убирает “невидимый блок”)
          maxHeight: showBottomUI ? 140 : 0,
          overflow: "hidden",

          opacity: bottomOpacity,
          pointerEvents: bottomPE,
          transition: disableBottomUIAnim ? "none" : "transform 180ms ease, opacity 120ms ease",
          willChange: disableBottomUIAnim ? "auto" : "transform",
          transform: bottomTransform,
        }}
      >
        {bottomNav}
      </div>
    </div>
  );
}
