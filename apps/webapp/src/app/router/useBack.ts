import { useEffect } from "react";

export function useBack(enabled: boolean) {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const back = tg?.BackButton;
    if (!enabled || !back) return;

    try { back.hide(); } catch {}
  }, [enabled]);
}
