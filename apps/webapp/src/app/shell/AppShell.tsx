import React, { useEffect, useMemo, useState } from "react";

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
  const [isInputActive, setIsInputActive] = useState(false);

  /**
   * Telegram WebView (особенно iOS) при закрытии клавиатуры делает несколько
   * пересчётов visualViewport. Если в этот момент вернуть BottomNav/BackBar,
   * они могут появиться на "старой" высоте и мгновенно уехать вниз (визуальный прыжок).
   *
   * Решение: держим нижние элементы скрытыми, пока visualViewport не стабилизируется.
   * Без таймеров "на глаз": только rAF + проверка стабильности высоты.
   */
  const [isViewportSettling, setIsViewportSettling] = useState(false);

  useEffect(() => {
    const isFormEl = (el: Element | null) => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if (node.isContentEditable) return true;
      return false;
    };

    const sync = () => setIsInputActive(isFormEl(document.activeElement));

    const onFocusIn = () => {
      setIsViewportSettling(false);
      sync();
    };

    const onFocusOut = () => {
      // предотвращаем "один кадр" появления навигации до прихода resize от visualViewport
      setIsViewportSettling(true);
      requestAnimationFrame(sync);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    sync();
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let raf = 0;
    let lastH = vv.height;
    let stable = 0;

    const tick = () => {
      const h = vv.height;
      if (Math.abs(h - lastH) < 0.5) stable += 1;
      else stable = 0;

      lastH = h;

      if (stable >= 2) {
        setIsViewportSettling(false);
        raf = 0;
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    const onVVChange = () => {
      setIsViewportSettling(true);
      stable = 0;
      lastH = vv.height;

      if (!raf) raf = requestAnimationFrame(tick);
    };

    vv.addEventListener("resize", onVVChange);
    vv.addEventListener("scroll", onVVChange);

    return () => {
      vv.removeEventListener("resize", onVVChange);
      vv.removeEventListener("scroll", onVVChange);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const showBottomUI = useMemo(() => {
    // Ввод важнее навигации: скрываем при активном input/textarea.
    // Плюс скрываем на время стабилизации viewport при закрытии клавиатуры.
    return !isInputActive && !isViewportSettling;
  }, [isInputActive, isViewportSettling]);

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
          paddingBottom: showBottomUI
            ? backBar?.show
              ? "calc(var(--app-pad) + var(--nav-h) + var(--safe-bottom) + 52px)" // 44 кнопка + 8 gap
              : "calc(var(--app-pad) + var(--nav-h) + var(--safe-bottom))"
            : "calc(var(--app-pad) + var(--safe-bottom))",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>

      {/* BackBar (outside scroll, above BottomNav) */}
      {backBar?.show && showBottomUI ? (
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
        </div>
      ) : null}

      {showBottomUI ? <div style={{ position: "relative", zIndex: 10 }}>{bottomNav}</div> : null}
    </div>
  );
}
