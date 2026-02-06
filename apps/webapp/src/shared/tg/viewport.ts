// Telegram WebApp viewport integration.
//
// Why:
// - iOS Telegram WebView often keeps the "layout viewport" height while keyboard is open,
//   which creates a large phantom block and allows the page to "drift".
// - visualViewport listeners are racey in TG iOS. Telegram provides its own viewport metrics
//   and events that are more reliable inside WebApp.
//
// What:
// - We expose current Telegram viewport height as a CSS var: --tg-vh (px)
// - Layout uses height: var(--tg-vh, 100dvh)

type TgWebApp = {
  viewportHeight: number;
  isExpanded?: boolean;
  expand?: () => void;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
};

function getTg(): TgWebApp | null {
  const w = window as unknown as { Telegram?: { WebApp?: TgWebApp } };
  return w.Telegram?.WebApp ?? null;
}

export function installTelegramViewportCssVar(): () => void {
  const tg = getTg();
  if (!tg) return () => {};

  const apply = () => {
    // viewportHeight is in pixels and reflects the visible area inside Telegram.
    // Clamp to a sane minimum to avoid 0 during transient states.
    const h = Math.max(320, Math.floor(tg.viewportHeight || 0));
    document.documentElement.style.setProperty("--tg-vh", `${h}px`);
  };

  apply();

  // Ensure we are expanded (optional but helps reduce weird intermediate viewport states)
  try {
    if (typeof tg.expand === "function") tg.expand();
  } catch {
    // ignore
  }

  const onViewport = () => apply();
  tg.onEvent?.("viewportChanged", onViewport);

  // Also apply on orientation changes as a fallback
  window.addEventListener("orientationchange", apply, { passive: true });
  window.addEventListener("resize", apply, { passive: true });

  return () => {
    tg.offEvent?.("viewportChanged", onViewport);
    window.removeEventListener("orientationchange", apply);
    window.removeEventListener("resize", apply);
  };
}
