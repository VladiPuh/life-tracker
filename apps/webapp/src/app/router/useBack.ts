import { useEffect } from "react";

export function useBack(opts: {
  enabled: boolean;
  onBack: () => void;
}) {
  const { enabled, onBack } = opts;

  useEffect(() => {
    if (!enabled) return;

    const tg = (window as any).Telegram?.WebApp;
    const back = tg?.BackButton;
    if (!back) return;

    back.onClick(onBack);

    return () => {
      try { back.offClick(onBack); } catch {}
    };
  }, [enabled, onBack]);
}
