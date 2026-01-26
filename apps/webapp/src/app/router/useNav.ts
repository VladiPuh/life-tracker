import { useCallback, useEffect, useState } from "react";
import type { Screen } from "../../shared/domain/types";

export function useNav() {
  const [screen, setScreen] = useState<Screen>("TODAY");

  const go = useCallback((next: Screen) => {
    // 👉 при входе в DETAIL создаём history entry
    if (next === "DETAIL") {
      window.history.pushState({ screen: "DETAIL" }, "");
    }
    setScreen(next);
  }, []);

  const goToday = useCallback(() => {
    setScreen("TODAY");
  }, []);

  const goTemplates = useCallback(() => setScreen("TEMPLATES"), []);
  const goAdd = useCallback(() => setScreen("ADD"), []);

  // 👉 слушаем системный Back (iOS / Android)
  useEffect(() => {
    const onPop = () => {
      setScreen("TODAY");
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return { screen, go, goToday, goTemplates, goAdd };
}
