import WebApp from "@twa-dev/sdk";

export function getInitData(): string {
  // 1) если Telegram WebApp уже инициализировался
  const fromWebApp = WebApp?.initData ?? "";
  if (fromWebApp) return fromWebApp;

  // 2) fallback: если Telegram передал данные в URL hash
  const hash = window.location.hash || "";
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return params.get("tgWebAppData") ?? "";
}
