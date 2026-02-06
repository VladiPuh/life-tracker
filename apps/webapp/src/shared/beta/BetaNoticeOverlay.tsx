import { useEffect, useMemo, useState } from "react";

const LS_KEY = "lt_beta_notice_hidden_v1";

function readHidden(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeHidden(v: boolean) {
  try {
    if (v) localStorage.setItem(LS_KEY, "1");
    else localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

/**
 * Beta notice:
 * - shows on every entry to the Mini App (page load + return to foreground),
 * - until user explicitly opts out.
 */
export function BetaNoticeOverlay() {
  const [hidden, setHidden] = useState<boolean>(() => readHidden());
  const [open, setOpen] = useState<boolean>(() => !readHidden());
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (hidden) return;

    const onEntry = () => {
      if (readHidden()) {
        setHidden(true);
        setOpen(false);
        return;
      }
      setDontShowAgain(false);
      setOpen(true);
    };

    // initial load == entry
    onEntry();

    const onVis = () => {
      if (document.visibilityState === "visible") onEntry();
    };
    const onPageShow = () => {
      // bfcache restore on mobile webviews
      onEntry();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [hidden]);

  const ui = useMemo(() => {
    if (hidden || !open) return null;

    const onOk = () => {
      if (dontShowAgain) {
        writeHidden(true);
        setHidden(true);
      }
      setOpen(false);
    };

    return (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          background: "rgba(0,0,0,0.38)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding:
            "calc(var(--app-pad) + var(--safe-top)) var(--app-pad) calc(var(--app-pad) + var(--safe-bottom))",
          boxSizing: "border-box",
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
            boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.2, marginBottom: 10 }}>
            Life Tracker — beta-версия
          </div>

          <div style={{ fontSize: 13, lineHeight: 1.4, opacity: 0.92 }}>
            <div style={{ marginBottom: 10 }}>
              Это тестовая версия приложения для фиксации привычек и ежедневных действий.
            </div>
            <div style={{ marginBottom: 10 }}>
              Функциональность и данные могут меняться или быть сброшены без уведомления.
              <br />
              Используйте свободно — это часть бета-тестирования.
            </div>
            <div>
              Обратную связь, идеи и предложения можно написать мне в Telegram: <b>@vladi_puh</b>
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 14,
              fontSize: 13,
              userSelect: "none",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span>Не показывать больше</span>
          </label>

          <button
            onClick={onOk}
            style={{
              width: "100%",
              marginTop: 14,
              height: 44,
              borderRadius: 14,
              border: "1px solid var(--lt-border)",
              background: "var(--lt-bg)",
              color: "var(--lt-text)",
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: -0.2,
              cursor: "pointer",
            }}
          >
            Понял
          </button>
        </div>
      </div>
    );
  }, [dontShowAgain, hidden, open]);

  return ui;
}
