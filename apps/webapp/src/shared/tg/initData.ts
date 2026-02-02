import WebApp from "@twa-dev/sdk";

export function getInitData(): string {
  // 1) самый прямой источник (часто доступен раньше SDK-обёртки)
  const direct = (window as any).Telegram?.WebApp?.initData ?? "";
  if (direct) return direct;

  // 2) SDK
  const fromWebApp = WebApp?.initData ?? "";
  if (fromWebApp) return fromWebApp;

  // 3) fallback: tgWebAppData в hash (валидно для WebApp контекста)
  const hash = window.location.hash || "";
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return params.get("tgWebAppData") ?? "";
}
