import { useEffect } from "react";

export function useBack(opts: {
  enabled: boolean;      // tgOk
  shouldShow: boolean;   // вычисляем в App
  onBack: () => void;    // обычно nav.goBack() + локальные сбросы
}) {
  const { enabled, shouldShow, onBack } = opts;

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const back = tg?.BackButton;
    if (!enabled || !back) return;

    // show/hide — обязанность владельца BackButton
    try {
      if (shouldShow) back.show();
      else back.hide();
    } catch {}

    back.onClick(onBack);

    return () => {
      try { back.offClick(onBack); } catch {}
    };
  }, [enabled, shouldShow, onBack]);
}
