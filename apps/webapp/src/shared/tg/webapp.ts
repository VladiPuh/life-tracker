import WebApp from "@twa-dev/sdk";

export function hasTelegramWebApp(): boolean {
  return Boolean((window as any).Telegram?.WebApp);
}

export function getPlatform(): string | undefined {
  try {
    return WebApp?.platform;
  } catch {
    return undefined;
  }
}

export function getSdkInitDataLen(): number {
  try {
    return (WebApp?.initData ?? "").length;
  } catch {
    return 0;
  }
}

export function initTelegram(): void {
  try {
    WebApp.ready(); // важно для iOS
  } catch {}
  try {
    WebApp.expand(); // на всякий случай (панель/viewport)
  } catch {}
}

export function logTelegramReady(tag = "[TG] ready"): void {
  try {
    // диагностический лог (оставь на время теста)
    // eslint-disable-next-line no-console
    console.log(tag, {
      platform: WebApp.platform,
      initDataLen: (WebApp.initData ?? "").length,
      hasBackButton: Boolean(WebApp?.BackButton),
    });
  } catch {}
}

export function bindTelegramBackButton(args: {
  enabled: boolean;
  shouldShow: boolean;
  onBack: () => void;
}): () => void {
  if (!args.enabled) return () => {};

  const bb = WebApp?.BackButton;
  if (!bb) return () => {};

  if (args.shouldShow) {
    try {
      bb.show();
    } catch {}

    bb.onClick(args.onBack);

    return () => {
      try {
        bb.offClick(args.onBack);
      } catch {}
    };
  }

  try {
    bb.hide();
  } catch {}

  return () => {};
}
